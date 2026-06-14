import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { messages } from "../../db/schema.js";
import { eq, and, or } from "drizzle-orm";

export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const fromUser = url.searchParams.get("from");
    const toUser = url.searchParams.get("to");
    if (!fromUser || !toUser) {
      return Response.json({ error: "Paramètres from/to requis" }, { status: 400 });
    }
    const conv = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUser, fromUser), eq(messages.toUser, toUser)),
          and(eq(messages.fromUser, toUser), eq(messages.toUser, fromUser))
        )
      )
      .orderBy(messages.createdAt);
    return Response.json(conv);
  }

  if (req.method === "POST") {
    const { from, to, message, type } = await req.json();
    if (!from || !to || !message) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const [msg] = await db
      .insert(messages)
      .values({ fromUser: from, toUser: to, message, type: type || "text" })
      .returning();
    return Response.json(msg, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/messages" };
