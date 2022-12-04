import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../util/prismadb";

import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";

// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify-request",
  },
  providers: [
    // WE SHOULD ONLY ADD OAUTH2 PROVIDERS WHERE EMAIL IS GUARENTEED TO BE VERIFIED.
    // THIS IS NOT IN THE OAUTH2 PROTOCOL, SO THERE CAN BE PROVIDERS WHERE
    // USERS CAN REGISTER AN EMAIL ADDRESS THAT IS NOT THEIRS.
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
    async signIn({ user, account }) {
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
      });

      // if the account exists, let it through
      if (existingAccount) return true;

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

      // get the user
      const existingUser = await prisma.user.findFirst({
        where: { email: user.email },
      });

      if (!existingUser) {
        // if the user doesn't exist, create the user and account and let it through
        try {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
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
            email: user.email,
            name: user.name,
            image: user.image,
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

export default NextAuth(authOptions);
