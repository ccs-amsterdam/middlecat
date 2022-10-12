import type { NextApiRequest, NextApiResponse } from "next";
import { generateKeyPair } from "crypto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  generateKeyPair(
    "rsa",
    {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        //cipher: "aes-256-cbc",
        //passphrase: "top secret",
      },
    },
    (err, publicKey, privateKey) => {
      res.status(200).json({ publicKey, privateKey });
    }
  );
}
