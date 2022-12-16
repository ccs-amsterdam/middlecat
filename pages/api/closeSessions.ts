import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../functions/prismadb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await getSafeSession(req, res);

  const ids = req?.body?.amcatSessionIds;
  if (!ids) return res.status(404).send("Invalid request");

  await prisma.amcatSession.deleteMany({
    where: { id: { in: ids } },
  });

  res.status(200).send("Deleted session");
}
