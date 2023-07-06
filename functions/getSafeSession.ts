import { createHash } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

import { authOptions } from "../pages/api/auth/[...nextauth]";

export default async function getSafeSession(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(403).send("Need to be signed in");
  }

  let csrfValidated = false;
  try {
    csrfValidated = await verifyCsrf(req, res);
  } catch (e) {
    console.log("error", e);
  }

  if (!csrfValidated) {
    res.status(403).send("Invalid csrf token");
    return;
  }

  return session;
}

function verifyCsrf(req: NextApiRequest, res: NextApiResponse): boolean {
  if (!req.headers.cookie) return false;
  for (let cookie of req.headers.cookie.split(";")) {
    const isCsrf = cookie.trim().includes("next-auth.csrf-token");
    if (!isCsrf) continue;

    const cleanCookie = cookie.split("=")[1].trim();
    const [token, hash] = cleanCookie.split("%7C");

    // verify csrf token was not forged
    const secret = process.env.NEXTAUTH_SECRET;
    const validHash = createHash("sha256")
      .update(`${token}${secret}`)
      .digest("hex");
    if (validHash !== hash) return false;

    // verify csrf token matches
    return token === req.body.csrfToken;
  }
  return false;
}
