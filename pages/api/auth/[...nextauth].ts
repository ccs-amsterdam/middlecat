import NextAuth, { User, Account, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../functions/prismadb";

import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { AdapterUser } from "next-auth/adapters";
import { NextApiRequest, NextApiResponse } from "next";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, authOptions);
}

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    // WE SHOULD ONLY ADD OAUTH2 PROVIDERS WHERE EMAIL IS GUARENTEED TO BE VERIFIED.
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  theme: {
    colorScheme: "light",
  },
  callbacks: {
    async session({ session, user }) {
      session.userId = user.id;

      // nextauth doesn't show session id (or is just don't know how),
      // but we can find it based on expiration time and user
      const s = await prisma.session.findFirst({
        where: {
          userId: user.id,
          expires: session.expires,
        },
      });
      session.id = s?.id || "";

      return session;
    },

    async signIn({ user, account }) {
      // nextauth has typed user to only have user.email, but it can actually
      // have name and image as well.
      const u = user as any;

      if (!account) return false;
      // Force linking of accounts with the same email address. Based on:
      //   https://github.com/danyel117/wanda/blob/main/pages/api/auth/%5B...nextauth%5D.ts

      // if the email was not provided, return false
      if (!user.email) return false;

      // !! ADD CHECK FOR WHETHER PROVIDER SAYS EMAIL IS NOT VERIFIED
      // (or only include providers that always do)

      // if account provider is email, always let true (this isn't blocked by nextauth)
      if (account.provider === "email") return true;

      // fetch the account of the user. (users are unique email-addresses, which can have
      // multiple accounts for different identity provider, like google, github, email, etc.)
      const existingAccount = await prisma.account.findFirst({
        where: {
          providerAccountId: account.providerAccountId,
        },
        include: {
          user: true,
        },
      });

      // if the account exists, let it through
      if (existingAccount) {
        await fillEmptyUserDetails(user, existingAccount.user);
        return true;
      }

      // if account doesn't exist we'll create one, but first need
      // to check if user exists
      const existingUser = await prisma.user.findFirst({
        where: { email: user.email },
      });

      const newAccount = {
        provider: account.provider,
        type: account.type,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        expires_at: account.expires_at,
        scope: account.scope,
        token_type: account.token_type,
        id_token: account.id_token,
      };

      if (!existingUser) {
        // if the user doesn't exist, create the user and account and let it through
        try {
          await prisma.user.create({
            data: {
              email: u.email,
              name: u.name,
              image: u.image,
              accounts: {
                create: newAccount,
              },
            },
          });
          return true;
        } catch {
          return false;
        }
      }

      // if we're here, the user does exist, but doesn't have an account for this provider yet.
      // We need to create the new account manually using the email address to connect it to existing accounts.
      // This way we override NextAuths default behavior of not linking them (additional warning that
      // this is only safe if we only use providers where email is verified).
      // Also,

      // if the user exists but it does not have accounts, create the account and let it through
      if (existingUser) {
        await fillEmptyUserDetails(user, existingUser);
        await prisma.account.create({
          data: {
            ...newAccount,
            user: {
              connect: {
                email: user.email ?? "",
              },
            },
          },
        });
        return true;
      }

      try {
        await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            image: u.image,
            accounts: {
              create: newAccount,
            },
          },
        });
        return true;
      } catch {
        return false;
      }
    },
  },
};

async function fillEmptyUserDetails(
  user: User | AdapterUser,
  existingUser: User
) {
  // use details (name, image) of current account.
  // if details are missing, use most recent (if existing)
  const name = user.name || existingUser.name || "";
  const image = user.image || existingUser.image || "";
  await prisma.user.update({
    where: { id: existingUser.id },
    data: { name, image },
  });
}
