import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const publicKey = process.env.NEXT_PUBLIC_PUBLICKEY || "";

  const configuration = {
    public_key: publicKey,
  };
  res.status(200).json(configuration);
}
