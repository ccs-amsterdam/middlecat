import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../functions/prismadb";
import { randomBytes } from "crypto";
import settings from "../../functions/settings";
import createdOnDetails from "../../functions/createdOnDetails";
import getSafeSession from "../../functions/getSafeSession";
import { createTokens } from "../../functions/grantTypes";

/**
 * Creates an AmCAT session.
 * if oauth is true, returns the authCode and state.
 * Otherwise, immediately returns the tokens
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSafeSession(req, res);
  if (!session?.id) return res.status(500);

  const {
    clientId,
    state,
    codeChallenge,
    label,
    type,
    scope,
    refreshRotate,
    expiresIn,
    resource,
    resourceConfig,
    oauth = true,
  } = req.body || {};

  if (!clientId || !resource || !label || !type || !resourceConfig) {
    res.status(404).send("Invalid request");
    return;
  }

  if (oauth && (!codeChallenge || !state)) {
    // if oauth is false, the session is only created, and no secret/codechallenge will
    // be set, so that it cannot be activated with an authorization code request. If it's
    // true, request must have a state and codeChallenge for a secure OAuth flow
    res.status(404).send("Invalid OAuth request");
    return;
  }
  if (type !== "browser" && type !== "apiKey") {
    res.status(404).send("Invalid type");
    return;
  }

  if (!resourceConfig) {
    // While this could also be retrieved here, we now require the config to be
    // fetched client side. This way, it still works if the AmCAT resource is hosted local.
    // The 404 message takes into account that the client did use getResourceConfig
    res.status(404).send("Could not connect to server");
    return;
  }

  if (resourceConfig.middlecat_url !== process.env.NEXTAUTH_URL) {
    res
      .status(404)
      .send(`Server uses other Middlecat: ${resourceConfig.middlecat_url}`);
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
      codeChallenge: oauth ? codeChallenge : null,
      secret: oauth ? randomBytes(64).toString("hex") : null,
      secretExpires: oauth ? new Date(Date.now() + 1000 * 60 * 10) : null, // 10 minutes
    },
  });

  if (oauth) {
    res
      .status(200)
      .json({ authCode: amcatsession.id + "." + amcatsession.secret, state });
    return;
  } else {
    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) return res.status(500).send("User doesn't exist");
    await createTokens(res, req, amcatsession, user);
  }
}
