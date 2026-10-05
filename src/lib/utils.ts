export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function money(amount: number): string {
  return `K${amount.toLocaleString("en-US")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Current MUBAS semester label, e.g. "2026/27 · Semester 1". */
export function semesterNow(now = new Date()): string {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = January
  if (month >= 7) return `${year}/${String((year + 1) % 100).padStart(2, "0")} · Semester 1`;
  return `${year - 1}/${String(year % 100).padStart(2, "0")} · Semester 2`;
}

export function receiptTracking(seq: number, now = new Date()): string {
  const yy = String(now.getFullYear() % 100).padStart(2, "0");
  return `MUBAS/RCPT/${yy}/${String(seq).padStart(6, "0")}`;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

/** Only allow same-site relative paths as post-login redirect targets. */
export function safeReturnPath(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
