import type { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload } from "jsonwebtoken";
import NextCors from "nextjs-cors";

/**
 * For testing the auto refresh in useMiddlecat
 */

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
  const payload = jwt.decode(access_token) as JwtPayload;
  const exp = payload?.exp || 0;

  const now = Date.now() / 1000;
  if (exp < now) {
    console.log("should refresh");
    res.status(403).send("You should totallly refresh your token");
  } else {
    res
      .status(201)
      .send(`access token expires in ${Math.floor(exp - now)} seconds`);
  }
}
