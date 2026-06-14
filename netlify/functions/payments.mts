import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { payments } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export default async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (req.method === "POST" && action === "submit") {
    const { username, imageData } = await req.json();
    if (!username || !imageData) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const [row] = await db
      .insert(payments)
      .values({ username, imageData, status: "pending" })
      .returning({ id: payments.id, createdAt: payments.createdAt });
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  }

  if (req.method === "GET" && action === "list") {
    const username = url.searchParams.get("username");
    if (!username) return Response.json({ error: "username requis" }, { status: 400 });
    const rows = await db
      .select({ id: payments.id, status: payments.status, approvedAmount: payments.approvedAmount, createdAt: payments.createdAt })
      .from(payments)
      .where(eq(payments.username, username))
      .orderBy(desc(payments.createdAt));
    return Response.json(rows);
  }

  return new Response("Not found", { status: 404 });
};

export const config: Config = { path: "/api/payments" };
