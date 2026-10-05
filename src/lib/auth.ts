import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDb, usingPostgres } from "./db";
import { findUserById } from "./db/store";
import { hashPassword } from "./password";
import type { Role, User } from "./types";

const COOKIE_NAME = "mubas_hostel_session";
const SECRET = process.env.SESSION_SECRET ?? "mubas-smart-hostel-dev-secret";

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const expected = Buffer.from(hashPassword(password));
  const actual = Buffer.from(passwordHash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function issueToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, iat: Date.now() }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function setSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, issueToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    // Prototype runs over plain http on the preview host; flip to true behind TLS.
    secure: false,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const { userId } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId: string;
    };
    // Postgres lookups hit the primary-key index instead of hydrating every table.
    if (usingPostgres()) return await findUserById(userId);
    const db = await readDb();
    return db.users.find((u) => u.id === userId) ?? null;
  } catch {
    return null;
  }
}

function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "security") return "/guard";
  return "/dashboard";
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  return user;
}

export async function requireRole(roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export function roleHome(role: Role): string {
  return homeFor(role);
}
