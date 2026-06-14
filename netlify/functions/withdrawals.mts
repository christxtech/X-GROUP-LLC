import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { withdrawals } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export default async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (req.method === "POST" && action === "submit") {
    const { username, amount, method, contact } = await req.json();
    if (!username || !amount || !method || !contact) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    if (amount <= 0) {
      return Response.json({ error: "Montant invalide" }, { status: 400 });
    }
    const [row] = await db
      .insert(withdrawals)
      .values({ username, amount, method, contact, status: "pending", delay: "Instant to 24h" })
      .returning({ id: withdrawals.id, createdAt: withdrawals.createdAt });
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  }

  if (req.method === "GET" && action === "list") {
    const username = url.searchParams.get("username");
    if (!username) return Response.json({ error: "username requis" }, { status: 400 });
    const rows = await db
      .select({ id: withdrawals.id, amount: withdrawals.amount, method: withdrawals.method, contact: withdrawals.contact, status: withdrawals.status, delay: withdrawals.delay, createdAt: withdrawals.createdAt })
      .from(withdrawals)
      .where(eq(withdrawals.username, username))
      .orderBy(desc(withdrawals.createdAt));
    return Response.json(rows);
  }

  return new Response("Not found", { status: 404 });
};

export const config: Config = { path: "/api/withdrawals" };
