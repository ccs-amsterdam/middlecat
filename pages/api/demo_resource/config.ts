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
  const host = req?.headers?.host || "";
  const protocol = /^localhost/.test(host) ? "http://" : "https://";
  const data = {
    middlecat_url: protocol + host,
    authorization: "allow_guests", // "no_auth", "allow_guests", "allow_authenticated_guests", "authorized_users_only"
  };

  res.status(200).json(data);
}
