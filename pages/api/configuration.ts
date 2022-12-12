import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const publicKey = process.env.NEXT_PUBLIC_PUBLICKEY || "";

  const configuration = {
    note: "any more config to add? We don't really need to have a full .well-known/configuration OIDC config",
    public_key: publicKey,
  };
  res.status(200).json(configuration);
}
