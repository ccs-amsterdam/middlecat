import type { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ["GET"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  // This should return the trusted middlecat server.
  // In this example its the same server that hosts middlecat
  const data = {
    middlecat_url: `http://${req?.headers?.host || ""}`,
  };

  res.status(200).json(data);
}
