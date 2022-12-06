import type { NextApiRequest, NextApiResponse } from "next";
import { createAccessToken } from "../../util/createJWT";
import { randomBytes } from "crypto";
import prisma from "../../util/prismadb";
import { createHash } from "crypto";
import NextCors from "nextjs-cors";
import { AmcatSession } from "@prisma/client";
import { User } from "next-auth";

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

  if (req.body.grant_type === "kill_session") {
    await killSessionRequest(res, req);
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
    where: { id },
    include: { user: true },
  });

  if (!session) {
    return res.status(401).send({ message: "Invalid token request" });
  }

  if (
    session.codeChallenge !== codeChallenge ||
    session.secret !== secret ||
    session.secretUsed ||
    session.secretExpires < new Date(Date.now())
  ) {
    // Reasons for deleting the session
    // - Session can be compromised if codeChallenge failed or secret has already been used
    // - If the secret expired, the session can never be started
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

  await createTokens(res, req, session, session.user);
}

async function refreshTokenRequest(res: NextApiResponse, req: NextApiRequest) {
  const refreshToken = req.body.refresh_token;
  const [id, secret] = refreshToken.split(".");

  const arf = await prisma.amcatRefreshToken.findFirst({
    where: { id, secret },
    include: {
      amcatsession: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!arf) {
    return res.status(401).send({ message: "Invalid refreshtoken request" });
  }

  const leeway = 2000;
  if (arf.invalidSince && arf.invalidSince < new Date(Date.now() - leeway)) {
    // we use rotating refresh tokens, so if a token is used multiple times,
    // it indicates that the session could be compromised. Due to possible
    // race conditions, we do allow for a small time window (leeway).
    await prisma.amcatSession.delete({
      where: { id: arf.amcatsessionId },
    });
    return res.status(401).send({ message: "Invalid refreshtoken request" });
  }

  await prisma.amcatRefreshToken.update({
    where: { id: arf.id },
    data: { invalidSince: new Date(Date.now()) },
  });

  await createTokens(res, req, arf.amcatsession, arf.amcatsession.user);
}

async function createTokens(
  res: NextApiResponse,
  req: NextApiRequest,
  session: AmcatSession,
  user: User
) {
  const { clientId, resource } = session;
  const { email, name, image } = user;

  // middlecat should always be on https, but exception for localhost
  const host = req.headers.host || "";
  const protocol = /^localhost/.test(host) ? "http://" : "https://";
  const middlecat = protocol + host;

  // expire 30 minutes from now
  // (exp seems to commonly be in seconds)
  const exp = Math.floor(Date.now() / 1000) + 60 * 30;

  const access_token = createAccessToken({
    clientId,
    resource,
    email: email || "",
    name: name || "",
    image: image || "",
    exp,
    middlecat,
  });

  const art = await prisma.amcatRefreshToken.create({
    data: {
      amcatsessionId: session.id,
      secret: randomBytes(32).toString("hex"),
      created: new Date(Date.now()),
    },
  });
  const refresh_token = art.id + "." + art.secret;

  res.status(200).json({ access_token, refresh_token });
}

async function killSessionRequest(res: NextApiResponse, req: NextApiRequest) {
  const refreshToken = req.body.refresh_token;
  const [id, secret] = refreshToken.split(".");

  const arf = await prisma.amcatRefreshToken.findFirst({
    where: { id, secret },
  });

  if (arf) {
    // note that here we don't care if the refresh token is already invalid.
    //
    await prisma.amcatSession.delete({
      where: { id: arf.amcatsessionId },
    });
  }

  res.status(201).send({ message: "Session killed (yay)" });
}
