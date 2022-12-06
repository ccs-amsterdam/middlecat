import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import NextCors from "nextjs-cors";

/**
 * For testing the auto refresh in useMiddlecat
 */

let public_key = "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  const access_token = req.headers.authorization?.split(" ")[1] || "";

  // these should be fixed on the server, and the server should only
  // accept tokens if they have the server's own address as resource.
  // (MiddleCat asked the used permission to access this resource)
  let resource = `http://${req?.headers?.host}/api/demo_resource`;
  if (!public_key) {
    const trusted_middlecat = `http://${req?.headers?.host}`;

    const res = await fetch(trusted_middlecat + "/api/public_key");
    public_key = await res.json();
  }

  const payload = jwt.verify(access_token, public_key);
  if (!payload || payload.resource !== resource) {
    res.status(401).send(`Invalid token`);
  }

  const exp = payload?.exp || 0;
  const now = Date.now() / 1000;
  res
    .status(201)
    .send(
      `Access token validated. Expires in ${Math.floor(exp - now)} seconds`
    );
}
