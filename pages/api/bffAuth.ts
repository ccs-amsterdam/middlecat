import type { NextApiRequest, NextApiResponse } from "next";
import { bffAuthHandler } from "middlecat-react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return await bffAuthHandler(req, res);
}
