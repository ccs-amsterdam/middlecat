import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prismadb";
import NextCors from "nextjs-cors";

import {
  authorizationCodeRequest,
  refreshTokenRequest,
  killSessionRequest,
} from "../../util/grantTypes";

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

  // whenever the token endpoint is called, first delete any
  // expired sessions
  await prisma.amcatSession.deleteMany({
    where: {
      OR: [
        {
          expires: {
            lte: new Date(Date.now()),
          },
        },
        {
          refreshExpires: {
            lte: new Date(Date.now()),
          },
        },
      ],
    },
  });

  if (req.body.grant_type === "authorization_code") {
    await authorizationCodeRequest(res, req);
  }

  if (req.body.grant_type === "refresh_token") {
    await refreshTokenRequest(res, req);
  }

  if (req.body.grant_type === "kill_session") {
    await killSessionRequest(res, req);
  }
}
