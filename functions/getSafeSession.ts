import type { NextApiRequest, NextApiResponse } from "next";
import { getCsrfToken } from "next-auth/react";
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

  // console.log("-0000000000");
  // console.log(req);
  // const token = await getCsrfToken({ req });
  // console.log("-1111111111");
  // console.log(req.body.csrfToken);
  // console.log(token);
  // if (token !== req.body.csrfToken) {
  //   console.log("Invalid csrf token", token, req.body.csrfToken);
  //   res.status(403).send("Invalid csrf token");
  //   return;
  // }
  return session;
}
