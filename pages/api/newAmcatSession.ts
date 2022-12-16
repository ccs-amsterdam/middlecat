import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../functions/prismadb";
import { randomBytes } from "crypto";
import settings from "../../functions/settings";
import createdOnDetails from "../../functions/createdOnDetails";
import getSafeSession from "../../functions/getSafeSession";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSafeSession(req, res);
  if (!session?.id) return res.status(500);

  const {
    clientId,
    resource,
    state,
    codeChallenge,
    label,
    type,
    scope,
    refreshRotate,
    expiresIn,
  } = req.body || {};

  if (!clientId || !resource || !state || !codeChallenge || !label || !type) {
    res.status(404).send("Invalid request");
    return;
  }
  if (type !== "browser" && type !== "apiKey") {
    res.status(404).send("Invalid type");
    return;
  }

  // The relation between Middlecat session and AmCAT sessions serves to
  // disconnect the AmCAT sessions when a user signs out from MiddleCat.
  // For API keys we now disable this behavior.
  const sessionId = type === "apiKey" ? null : session.id;

  const userId = session.userId;
  const createdOn = createdOnDetails(req.headers["user-agent"] || "");
  const expires =
    expiresIn === null
      ? new Date(Date.now() + 1000 * 60 * 60 * settings.session_expire_hours)
      : new Date(Date.now() + 1000 * expiresIn);
  const refreshExpires =
    type === "browser"
      ? new Date(Date.now() + 1000 * 60 * 60 * settings.refresh_expire_hours)
      : null;

  // finally, create the new session
  const amcatsession = await prisma.amcatSession.create({
    data: {
      sessionId,
      type,
      label,
      createdOn,
      userId,
      clientId,
      resource,
      scope: scope || "",
      expires,
      refreshRotate: refreshRotate ?? true,
      refreshExpires,
      codeChallenge,
      secret: randomBytes(64).toString("hex"),
      secretExpires: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
    },
  });

  res.status(200).json({ ...amcatsession });
}
