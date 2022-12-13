import type { NextApiRequest, NextApiResponse } from "next";
import { createAccessToken } from "./createJWT";
import { randomBytes } from "crypto";
import prisma from "./prismadb";
import { createHash } from "crypto";
import { AmcatSession } from "@prisma/client";
import { User } from "next-auth";
import settings from "./settings";

export async function authorizationCodeRequest(
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
    where: { id, secret, codeChallenge },
    include: { user: true },
  });

  if (!session) {
    return res.status(401).send({ message: "Invalid token request" });
  }

  if (session.secretUsed || session.secretExpires < new Date(Date.now())) {
    // Reasons for deleting the session
    // - If secret already used, could be that bad actor was first
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

export async function refreshTokenRequest(
  res: NextApiResponse,
  req: NextApiRequest
) {
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
    // If refreshRotate is used, and refresh token is used multiple times,
    // it indicates that the session could be compromised. Due to possible
    // race conditions, we do allow for a small time window (leeway).
    await prisma.amcatSession.delete({
      where: { id: arf.amcatsessionId },
    });
    return res.status(401).send({ message: "Invalid refreshtoken request" });
  }

  if (arf.amcatsession.refreshRotate) {
    // invalidate previous refresh token (only if refresh token rotation is used)
    await prisma.amcatRefreshToken.update({
      where: { id: arf.id },
      data: { invalidSince: new Date(Date.now()) },
    });
  }

  // update refresh expire (we set refreshExpire in the session table becuase
  // its a bit more efficient when deleting expired sessions on every api/auth/token call)
  await prisma.amcatSession.update({
    where: { id: arf.amcatsession.id },
    data: {
      refreshExpires: new Date(
        Date.now() + 1000 * 60 * 60 * settings.refresh_expire_hours
      ),
    },
  });

  // if refresh token rotation is not used, pass a static refresh token to createTokens
  const static_refresh_token = arf.amcatsession.refreshRotate
    ? null
    : refreshToken;

  await createTokens(
    res,
    req,
    arf.amcatsession,
    arf.amcatsession.user,
    static_refresh_token
  );
}

export async function createTokens(
  res: NextApiResponse,
  req: NextApiRequest,
  session: AmcatSession,
  user: User,
  static_refresh_token?: string
) {
  const { clientId, resource } = session;
  const { email, name, image } = user;

  // middlecat should always be on https, but exception for localhost
  const host = req.headers.host || "";
  const protocol = /^localhost/.test(host) ? "http://" : "https://";
  const middlecat = protocol + host;

  // expire access tokens
  // (exp seems to commonly be in seconds)
  const exp =
    Math.floor(Date.now() / 1000) + 60 * settings.access_expire_minutes;

  const access_token = createAccessToken({
    clientId,
    resource,
    email: email || "",
    name: name || "",
    image: image || "",
    exp,
    middlecat,
  });

  const refresh_rotate = !static_refresh_token;
  let refresh_token: string;
  if (refresh_rotate) {
    const art = await prisma.amcatRefreshToken.create({
      data: {
        amcatsessionId: session.id,
        secret: randomBytes(32).toString("hex"),
      },
    });
    refresh_token = art.id + "." + art.secret;
  } else {
    refresh_token = static_refresh_token;
  }

  // oauth typically uses expires_in in seconds as a relative offset (due to local time issues).
  // we subtract 5 seconds because of possible delay in setting expires_in and the client receiving it
  const expires_in = settings.access_expire_minutes * 60 - 5;

  res.status(200).json({
    token_type: "bearer",
    access_token,
    refresh_token,
    refresh_rotate,
    expires_in,
  });
}

export async function killSessionRequest(
  res: NextApiResponse,
  req: NextApiRequest
) {
  const refreshToken = req.body.refresh_token;
  const [id, secret] = refreshToken.split(".");

  // You can kill a session if you have a refresh token.
  // (We don't care if the token is already expired)
  const arf = await prisma.amcatRefreshToken.findFirst({
    where: { id, secret },
    include: { amcatsession: true },
  });

  if (arf) {
    if (req.body?.sign_out && arf.amcatsession.sessionId) {
      // sign out from middlecat in general (also kills underlying amcat session)
      // amcatSessions for R, Python etc. tokens have no sessionId, so for these
      // we do have to kill the specific amcatSession
      await prisma.session.delete({
        where: { id: arf.amcatsession.sessionId },
      });
    } else {
      // only kill amcat session
      await prisma.amcatSession.delete({
        where: { id: arf.amcatsessionId },
      });
    }
  }

  res.status(201).send({ message: "Session killed (yay)" });
}
