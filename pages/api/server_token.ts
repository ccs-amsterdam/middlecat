import { unstable_getServerSession } from "next-auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "./auth/[...nextauth]";
import createJWT from "../../util/createJWT";

interface Request extends NextApiRequest {
  server: string;
}

export default async function handler(req: Request, res: NextApiResponse) {
  let server = req.query.server || "";
  // nextjs types parameters as string | string[]
  if (Array.isArray(server)) server = server[0];

  const session = await unstable_getServerSession(req, res, authOptions);

  if (session) {
    const user = {
      email: session?.user?.email || "",
      name: session?.user?.name || "",
      image: session?.user?.image || "",
      server,
    };
    const token = createJWT(user);
    res.status(200).json({ token });
  } else {
    res.status(403).send("Need to be signed in to request a server token");
  }
}
