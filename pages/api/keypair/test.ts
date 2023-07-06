import type { NextApiRequest, NextApiResponse } from "next";
import jwt, { SignOptions, Secret } from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const test = testJWT(
    process.env.PRIVATEKEY,
    process.env.NEXT_PUBLIC_PUBLICKEY
  );
  res.status(200).send(true);
}

function testJWT(privateKey: Secret, publicKey: Secret) {
  const payload = { example: "example" };

  const signOptions: SignOptions = {
    algorithm: "RS256",
  };

  const token = jwt.sign(payload, privateKey, signOptions);
  return jwt.verify(token, publicKey);
}
