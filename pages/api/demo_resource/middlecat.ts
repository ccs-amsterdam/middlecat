import type { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  const config = {
    middlecat_url: `http://${req?.headers?.host || ""}`,
    session_exp: 24 * 60 * 1000,
    refresh_exp: 1 * 60 * 1000,
  };

  res.status(200).json(config);
}
