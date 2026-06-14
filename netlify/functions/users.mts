import type { Config } from "@netlify/functions";
import { createHash } from "crypto";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";

function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

export default async (req: Request, context: any) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (req.method === "POST" && action === "register") {
    const { username, password, phone, name, address } = await req.json();
    if (!username || !password || !phone || !name || !address) {
      return Response.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const existing = await db.select().from(users).where(eq(users.username, username));
    if (existing.length > 0) {
      return Response.json({ error: "Nom d'utilisateur déjà pris" }, { status: 409 });
    }
    const [user] = await db
      .insert(users)
      .values({ username, passwordHash: hashPassword(password), phone, name, address })
      .returning({
        id: users.id,
        username: users.username,
        phone: users.phone,
        name: users.name,
        address: users.address,
        canUseVoice: users.canUseVoice,
        canUseImage: users.canUseImage,
        balance: users.balance,
      });
    return Response.json(user, { status: 201 });
  }

  if (req.method === "POST" && action === "login") {
    const { username, password } = await req.json();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user || user.passwordHash !== hashPassword(password)) {
      return Response.json({ error: "Identifiants incorrects" }, { status: 401 });
    }
    if (user.isStopped) {
      return Response.json({ error: "Compte suspendu. Contactez l'administrateur." }, { status: 403 });
    }
    return Response.json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      name: user.name,
      address: user.address,
      canUseVoice: user.canUseVoice,
      canUseImage: user.canUseImage,
      balance: user.balance,
    });
  }

  if (req.method === "GET" && action === "list") {
    const all = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        phone: users.phone,
      })
      .from(users);
    return Response.json(all);
  }

  if (req.method === "PUT" && action === "update") {
    const { username, phone, name, address } = await req.json();
    const [updated] = await db
      .update(users)
      .set({ phone, name, address })
      .where(eq(users.username, username))
      .returning({
        id: users.id,
        username: users.username,
        phone: users.phone,
        name: users.name,
        address: users.address,
        canUseVoice: users.canUseVoice,
        canUseImage: users.canUseImage,
        balance: users.balance,
      });
    return Response.json(updated);
  }

  if (req.method === "GET" && action === "balance") {
    const username = url.searchParams.get("username");
    if (!username) return Response.json({ error: "username requis" }, { status: 400 });
    const [user] = await db.select({ balance: users.balance }).from(users).where(eq(users.username, username));
    return Response.json({ balance: user?.balance ?? 0 });
  }

  if (req.method === "POST" && action === "debit") {
    const { username, amount } = await req.json();
    const [user] = await db.select({ balance: users.balance }).from(users).where(eq(users.username, username));
    if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    if ((user.balance ?? 0) < amount) {
      return Response.json({ error: "Solde insuffisant" }, { status: 400 });
    }
    await db.update(users).set({ balance: (user.balance ?? 0) - amount }).where(eq(users.username, username));
    return Response.json({ ok: true, balance: (user.balance ?? 0) - amount });
  }

  if (req.method === "POST" && action === "credit") {
    const { username, amount } = await req.json();
    const [user] = await db.select({ balance: users.balance }).from(users).where(eq(users.username, username));
    if (!user) return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    const newBalance = (user.balance ?? 0) + amount;
    await db.update(users).set({ balance: newBalance }).where(eq(users.username, username));
    return Response.json({ ok: true, balance: newBalance });
  }

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

  return new Response("Not found", { status: 404 });
};

export const config: Config = { path: "/api/users" };
