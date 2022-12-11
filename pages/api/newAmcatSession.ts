import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prismadb";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { randomBytes } from "crypto";
import settings from "../../util/settings";
import { getCsrfToken } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    res.status(403).send("Need to be signed in");
    return;
  }

  // double check whether this makes sense, because it seems that it can be
  // (or used to be) more complicated.
  const token = await getCsrfToken({ req });
  if (token !== req.body.csrfToken) {
    res.status(403).send("Invalid csrf token");
    return;
  }

  const { clientId, resource, state, codeChallenge, label, type } =
    req.body || {};
  if (!clientId || !resource || !state || !codeChallenge || !label || !type) {
    res.status(404).send("Invalid request");
    return;
  }
  if (type !== "browser" && type !== "api_key") {
    res.status(404).send("Invalid type");
    return;
  }

  const sessionId = session.id;
  const userId = session.userId;

  // finally, create the new session
  const amcatsession = await prisma.amcatSession.create({
    data: {
      sessionId,
      type,
      label,
      userId,
      clientId,
      resource,
      expires: new Date(
        Date.now() + 1000 * 60 * 60 * settings.session_expire_hours
      ),
      refreshExpires: new Date(
        Date.now() + 1000 * 60 * 60 * settings.refresh_expire_hours
      ),
      codeChallenge,
      secret: randomBytes(64).toString("hex"),
      secretExpires: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
    },
  });

  res.status(200).json({ ...amcatsession });
}
