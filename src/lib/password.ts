import { createHmac } from "node:crypto";

const SECRET = process.env.SESSION_SECRET ?? "mubas-smart-hostel-dev-secret";

/**
 * Demo-grade password hashing (HMAC-SHA256).
 * The system is an academic prototype; swap for bcrypt/argon2 in production.
 */
export function hashPassword(password: string): string {
  return createHmac("sha256", SECRET).update(`mubas:${password}`).digest("hex");
}
