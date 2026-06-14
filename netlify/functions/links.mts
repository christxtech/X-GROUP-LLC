import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { links } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method === "GET") {
    const all = await db.select().from(links).orderBy(links.createdAt);
    return Response.json(all);
  }

  if (req.method === "POST") {
    const { platform, url, username } = await req.json();
    if (!platform || !url) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const [link] = await db
      .insert(links)
      .values({ platform, url, username: username || "anonymous" })
      .returning();
    return Response.json(link, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/links" };
