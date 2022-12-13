import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "../../functions/prismadb";
import { BrowserSession, ApiKeySession } from "../../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    res.status(403).send("Need to be signed in");
    return;
  }

  const amcatSessions = await prisma.amcatSession.findMany({
    where: { userId: session.userId },
    orderBy: {
      expires: "asc",
    },
  });

  const browser: BrowserSession[] = [];
  const apiKey: ApiKeySession[] = [];

  for (let s of amcatSessions) {
    const { label, resource, expires, sessionId, id, createdOn, createdAt } = s;
    const current = sessionId === session.id;
    if (s.type === "browser")
      browser.push({
        label,
        createdOn,
        createdAt,
        resource,
        id,
        sessionId,
        current,
      });
    if (s.type === "apiKey")
      apiKey.push({ label, createdOn, createdAt, resource, expires, id });
  }
  res.status(200).json({ browser, apiKey });
}
