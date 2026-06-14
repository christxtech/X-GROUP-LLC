import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { spins } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const username = url.searchParams.get("username");
    if (username) {
      const userSpins = await db
        .select()
        .from(spins)
        .where(eq(spins.username, username))
        .orderBy(spins.createdAt);
      return Response.json(userSpins);
    }
    const all = await db.select().from(spins).orderBy(spins.createdAt);
    return Response.json(all);
  }

  if (req.method === "POST") {
    const { username, resultType, amount } = await req.json();
    if (!username || !resultType) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const [spin] = await db
      .insert(spins)
      .values({ username, resultType, amount: amount || 0 })
      .returning();
    return Response.json(spin, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/spins" };
