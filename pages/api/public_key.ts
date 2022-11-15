import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const publicKey = process.env.NEXT_PUBLIC_PUBLICKEY || "";
  res.status(200).json(publicKey);
}
