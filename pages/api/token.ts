import type { NextApiRequest, NextApiResponse } from "next";
import { createAccessToken } from "../../util/createJWT";
import { randomBytes } from "crypto";
import prisma from "../../util/prismadb";
import { createHash } from "crypto";
import NextCors from "nextjs-cors";
import { AmcatSession } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  if (req.method !== "POST") {
    // I think simple request would still go through
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  // whenever the token endpoint is called, first delete any
  // expired sessions
  await prisma.amcatSession.deleteMany({
    where: {
      expires: {
        lte: new Date(Date.now()),
      },
    },
  });

  if (req.body.grant_type === "authorization_code") {
    await authorizationCodeRequest(res, req);
  }

  if (req.body.grant_type === "refresh_token") {
    await refreshTokenRequest(res, req);
  }
}

async function authorizationCodeRequest(
  res: NextApiResponse,
  req: NextApiRequest
) {
  // validate the authorization code grant, and if pass create
  // the access token and refresh token
  const { code, code_verifier } = req.body;

  const codeChallenge = createHash("sha256")
    .update(code_verifier)
    .digest("base64url");

  // our authorization code is actually the table id + auth code
  const [id, secret] = code.split(".");

  const session = await prisma.amcatSession.findFirst({
    where: {
      id,
      secret,
      codeChallenge, // PKCE code challenge
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return res.status(401).send({ message: "Invalid token request" });
  }

  if (session.secretUsed || session.secretExpires < Date.now()) {
    // if session secret expired, delete the session.
    // if the secret is used twice, also delete it. This way,
    // if a malicious user already logged in, the refresh tokens are disabled
    await prisma.amcatSession.delete({
      where: { id: session.id },
    });
    return res.status(401).send({ message: "Invalid token request" });
  }

  // authorization code has now been validated. We set secretUsed to true
  // so that it cannot be used again
  await prisma.amcatSession.update({
    where: { id: session.id },
    data: { secretUsed: true },
  });

  await createTokens(res, req, session);
}

async function refreshTokenRequest(res: NextApiResponse, req: NextApiRequest) {
  const refreshToken = req.body.refresh_token;
  const [id, secret] = refreshToken.split(".");

  const arf = prisma.amcatRefreshToken.findFirst({
    where: { id, secret },
    include: {
      amcatsession: true,
    },
  });

  if (!arf) {
    return res.status(401).send({ message: "Invalid refreshtoken request" });
  }

  if (arf.invalid) {
    // we use rotating refresh tokens, so if a token is used multiple times,
    // it indicates that the session could be compromised.
    await prisma.amcatSession.delete({
      where: { id: arf.amcatsessionId },
    });
    return res.status(401).send({ message: "Invalid refreshtoken request" });
  }

  await prisma.amcatRefreshToken.update({
    where: { id: arf.id },
    data: { invalid: true },
  });

  await createTokens(res, req, arf.amcatsession);
}

async function createTokens(
  res: NextApiResponse,
  req: NextApiRequest,
  session: AmcatSession
) {
  const { clientId, resource } = session;
  const { email, name, image } = session.user;
  const middlecat = `https://${req.headers.host}`;

  // expire 30 minutes from now
  //const exp = Math.floor(Date.now() / 1000) + 60 * 30;
  const exp = Math.floor(Date.now() / 1000) + 60 * 30;

  const access_token = createAccessToken({
    clientId,
    resource,
    email,
    name,
    image,
    exp,
    middlecat,
  });

  const art = await prisma.amcatRefreshToken.create({
    data: {
      amcatsessionId: session.id,
      secret: randomBytes(64).toString("hex"),
    },
  });
  const refresh_token = art.id + "." + art.secret;

  // All the amcat_user stuff is also in the token, but it seems properly decoding the
  // base64 in client side js is non-trivial. For the client it doesn't have
  // to be super safe, so we just include it directly
  const amcat_user = { host: resource, email, name, image, exp, middlecat };
  res.status(200).json({ amcat_user, access_token, refresh_token });
}
