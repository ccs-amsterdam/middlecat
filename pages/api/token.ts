import type { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import rmExpiredSessions from "../../functions/rmExpiredSessions";

import {
  authorizationCodeRequest,
  refreshTokenRequest,
  killSessionRequest,
} from "../../functions/grantTypes";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  if (req.method !== "POST") {
    // I think simple request would still go through
    return res.status(405).send({ message: "Only POST requests allowed" });
  }

  // whenever the token endpoint is called, first delete any expired sessions
  await rmExpiredSessions();

  if (req.body.grant_type === "authorization_code") {
    return await authorizationCodeRequest(res, req);
  }

  if (req.body.grant_type === "refresh_token") {
    return await refreshTokenRequest(res, req);
  }

  if (req.body.grant_type === "kill_session") {
    return await killSessionRequest(res, req);
  }

  return res.status(400).send({ message: "Invalid or missing grant type" });
}
