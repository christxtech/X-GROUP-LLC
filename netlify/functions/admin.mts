import type { Config } from "@netlify/functions";
import { createHash } from "crypto";
import { db } from "../../db/index.js";
import { contacts, users, messages, spins, links, payments, withdrawals } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

const ADMIN_HASH =
  "ea4d8a0a8fdf024db72627d1c1c10e3167d45657569fd55dd6dd8d1b1d314c48";

function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (req.method === "POST" && action === "verify") {
    const { password } = await req.json();
    if (hashPassword(String(password)) === ADMIN_HASH) {
      return Response.json({ ok: true });
    }
    return Response.json({ ok: false, error: "Mot de passe incorrect" });
  }

  if (req.method === "GET" && action === "contacts") {
    const all = await db.select().from(contacts).orderBy(contacts.createdAt);
    return Response.json(all);
  }

  if (req.method === "GET" && action === "users") {
    const all = await db
      .select({
        id: users.id,
        username: users.username,
        phone: users.phone,
        name: users.name,
        address: users.address,
        canUseVoice: users.canUseVoice,
        canUseImage: users.canUseImage,
        balance: users.balance,
        isStopped: users.isStopped,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);
    return Response.json(all);
  }

  if (req.method === "GET" && action === "messages") {
    const all = await db.select().from(messages).orderBy(messages.createdAt);
    return Response.json(all);
  }

  if (req.method === "GET" && action === "spins") {
    const all = await db.select().from(spins).orderBy(spins.createdAt);
    return Response.json(all);
  }

  if (req.method === "GET" && action === "links") {
    const all = await db.select().from(links).orderBy(links.createdAt);
    return Response.json(all);
  }

  if (req.method === "POST" && action === "update-user-rights") {
    const { username, canUseVoice, canUseImage } = await req.json();
    await db
      .update(users)
      .set({ canUseVoice, canUseImage })
      .where(eq(users.username, username));
    return Response.json({ ok: true });
  }

  // Payments
  if (req.method === "GET" && action === "payments") {
    const all = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));
    return Response.json(all);
  }

  if (req.method === "POST" && action === "approve-payment") {
    const { id, amount } = await req.json();
    if (!id || !amount || amount <= 0) {
      return Response.json({ error: "ID et montant requis" }, { status: 400 });
    }
    const [pay] = await db.select().from(payments).where(eq(payments.id, id));
    if (!pay) return Response.json({ error: "Paiement introuvable" }, { status: 404 });

    await db.update(payments).set({ status: "approved", approvedAmount: amount }).where(eq(payments.id, id));

    const [user] = await db.select({ balance: users.balance }).from(users).where(eq(users.username, pay.username));
    if (user) {
      await db.update(users).set({ balance: (user.balance ?? 0) + amount }).where(eq(users.username, pay.username));
    }
    return Response.json({ ok: true });
  }

  if (req.method === "POST" && action === "refuse-payment") {
    const { id } = await req.json();
    await db.update(payments).set({ status: "refused" }).where(eq(payments.id, id));
    return Response.json({ ok: true });
  }

  // Withdrawals
  if (req.method === "GET" && action === "withdrawals") {
    const all = await db
      .select()
      .from(withdrawals)
      .orderBy(desc(withdrawals.createdAt));
    return Response.json(all);
  }

  if (req.method === "POST" && action === "validate-withdrawal") {
    const { id } = await req.json();
    const [wd] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    if (!wd) return Response.json({ error: "Retrait introuvable" }, { status: 404 });

    const [user] = await db.select({ balance: users.balance }).from(users).where(eq(users.username, wd.username));
    if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    if ((user.balance ?? 0) < wd.amount) {
      return Response.json({ error: "Solde insuffisant" }, { status: 400 });
    }
    await db.update(users).set({ balance: (user.balance ?? 0) - wd.amount }).where(eq(users.username, wd.username));
    await db.update(withdrawals).set({ status: "validated" }).where(eq(withdrawals.id, id));
    return Response.json({ ok: true });
  }

  if (req.method === "POST" && action === "refuse-withdrawal") {
    const { id } = await req.json();
    await db.update(withdrawals).set({ status: "refused" }).where(eq(withdrawals.id, id));
    return Response.json({ ok: true });
  }

  // Manual fund addition
  if (req.method === "POST" && action === "add-funds") {
    const { username, amount } = await req.json();
    if (!username || !amount || amount <= 0) {
      return Response.json({ error: "Username et montant requis" }, { status: 400 });
    }
    const [user] = await db.select({ balance: users.balance }).from(users).where(eq(users.username, username));
    if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    const newBalance = (user.balance ?? 0) + amount;
    await db.update(users).set({ balance: newBalance }).where(eq(users.username, username));
    return Response.json({ ok: true, balance: newBalance });
  }

  // Reset password
  if (req.method === "POST" && action === "reset-password") {
    const { username, newPassword } = await req.json();
    if (!username || !newPassword) {
      return Response.json({ error: "Username et nouveau mot de passe requis" }, { status: 400 });
    }
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
    if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.username, username));
    return Response.json({ ok: true });
  }

  // Stop / resume PIN (account)
  if (req.method === "POST" && action === "stop-pin") {
    const { username, stop } = await req.json();
    if (!username) return Response.json({ error: "Username requis" }, { status: 400 });
    await db.update(users).set({ isStopped: !!stop }).where(eq(users.username, username));
    return Response.json({ ok: true });
  }

  return new Response("Not found", { status: 404 });
};

export const config: Config = { path: "/api/admin" };
