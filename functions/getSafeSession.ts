import type { NextApiRequest, NextApiResponse } from "next";
import { getCsrfToken } from "next-auth/react";
import { unstable_getServerSession } from "next-auth";

import { authOptions } from "../pages/api/auth/[...nextauth]";

export default async function getSafeSession(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  const session = await unstable_getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(403).send("Need to be signed in");
  }

  const token = await getCsrfToken({ req });
  if (token !== req.body.csrfToken) {
    console.log("Invalid csrf token", token, req.body.csrfToken);
    res.status(403).send("Invalid csrf token");
    return;
  }
  return session;
}
