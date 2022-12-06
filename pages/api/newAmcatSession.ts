import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prismadb";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { randomBytes } from "crypto";
import settings from "../../util/settings";

// at the moment 1 day seems sensible since refresh tokens are
// only kept in memory. But if we manage to implement service workers
// we might keep them active a bit longer
const MAX_SESSION_DURATION_HOURS = 24;
const MAX_REFRESH_DURATION_HOURS = 2;

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

  const { clientId, resource, state, codeChallenge } = req.body || {};
  if (!clientId || !resource || !state || !codeChallenge) {
    res.status(404).send("Invalid request");
    return;
  }

  // Link amcat session to nextauth user table
  const user = await prisma.user.findFirst({
    where: {
      email: session.user.email,
    },
  });
  if (!user) {
    res.status(404).send("Invalid request");
    return;
  }
  const userId = user.id;

  // finally, create the new session
  const amcatsession = await prisma.amcatSession.create({
    data: {
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
