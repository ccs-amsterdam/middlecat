import jwt, { SignOptions, Secret } from "jsonwebtoken";

interface AccessTokenPayload {
  clientId: string;
  resource: string;
  email: string;
  name: string;
  image: string;
}

// can only be called server-side (from api endpoints)

export function createAccessToken(payload: AccessTokenPayload) {
  return createJWT(payload);
}

function createJWT(payload: Record<string, any>) {
  const privateKey: Secret = process.env.PRIVATEKEY || "";
  if (!privateKey || !payload) return "";

  const signOptions: SignOptions = {
    algorithm: "RS256",
  };

  return jwt.sign(payload, privateKey, signOptions);
}
