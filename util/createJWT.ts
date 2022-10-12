import jwt, { SignOptions, Secret } from "jsonwebtoken";

interface MiddlecatUser {
  email: string;
  name: string;
  image: string;
}

export default function createJWT(user: MiddlecatUser) {
  const privateKey: Secret = process.env.PRIVATEKEY || "";
  if (!privateKey || !user?.email) return "";

  const payload = { ...user };

  const signOptions: SignOptions = {
    //expiresIn:  "12h",
    algorithm: "RS256",
  };

  return jwt.sign(payload, privateKey, signOptions);
}
