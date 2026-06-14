import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { contacts } from "../../db/schema.js";

export default async (req: Request) => {
  if (req.method === "GET") {
    const all = await db.select().from(contacts).orderBy(contacts.createdAt);
    return Response.json(all);
  }

  if (req.method === "POST") {
    const { country, phone, name } = await req.json();
    if (!country || !phone || !name) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const [contact] = await db
      .insert(contacts)
      .values({ country, phone, name })
      .returning();
    return Response.json(contact, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = { path: "/api/contacts" };
