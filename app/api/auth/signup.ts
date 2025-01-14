import { NextApiRequest, NextApiResponse } from "next";
import { createUser } from "@/lib/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { email, password, name } = req.body;

    try {
      const user = await createUser(email, password, name);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
