import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prismadb";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { randomBytes } from "crypto";

const MAX_SESSION_DURATION_DAYS = 100;

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
  const user = await prisma.User.findFirst({
    where: {
      email: session.user.email,
    },
  });
  const userId = user.id;

  // optionally, we can delete previous session from the same user for the
  // same client and resource. This effectively logs users out if they
  // log in to the same amcat resource with the same client (but maybe on a different browser).
  // It is safer, but perhaps inconvenient. For now we go with safer, and
  // then determine how inconvenient it is.
  await prisma.AmcatSession.deleteMany({
    where: {
      userId,
      clientId,
      resource,
    },
  });

  // finally, create the new session
  const amcatsession = await prisma.AmcatSession.create({
    data: {
      userId,
      sessionId: session.id,
      clientId,
      resource,
      expires: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * MAX_SESSION_DURATION_DAYS
      ),
      codeChallenge,
      secret: randomBytes(64).toString("hex"),
      secretExpires: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
    },
  });

  // our authentication code is the id + secret
  const authCode = amcatsession.id + "." + amcatsession.secret;

  res.status(200).json({ authCode });
}
