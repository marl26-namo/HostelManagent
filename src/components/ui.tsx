import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "green" | "gold" | "red" | "dark";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-cream-200 text-ink-800 ring-cream-300",
  green: "bg-moss-500/15 text-forest-700 ring-moss-500/30",
  gold: "bg-gold-500/20 text-gold-600 ring-gold-500/40",
  red: "bg-clay-500/10 text-clay-600 ring-clay-500/30",
  dark: "bg-ink-900 text-gold-400 ring-ink-900",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl shadow-[0_18px_40px_-32px_rgba(7,23,19,0.65)]",
        dark ? "bg-ink-900 text-cream-100" : "bg-white ring-1 ring-cream-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl leading-tight text-ink-900 sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700/75">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  aside,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-ink-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-ink-700/70">{description}</p>
            ) : null}
          </div>
          {aside}
        </div>
      ) : null}
      {children}
    </Card>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "light",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "light" | "dark" | "gold";
}) {
  const skin =
    tone === "dark"
      ? "bg-ink-900 text-cream-50 ring-ink-800"
      : tone === "gold"
        ? "bg-gold-500 text-ink-900 ring-gold-400"
        : "bg-white text-ink-900 ring-cream-300";
  return (
    <div className={cn("rounded-2xl p-4 ring-1 ring-inset sm:p-5", skin)}>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.16em]",
          tone === "light" ? "text-ink-700/60" : "text-current opacity-70",
        )}
      >
        {label}
      </p>
      <p className="mt-2 font-display text-3xl leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-6 py-10 text-center">
      <p className="font-display text-lg text-ink-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-700/70">{body}</p>
    </div>
  );
}

export function Flash({ error, ok }: { error?: string | null; ok?: string | null }) {
  if (!error && !ok) return null;
  return (
    <div className="mb-5 space-y-2">
      {error ? (
        <p className="rounded-xl bg-clay-500/10 px-4 py-3 text-sm font-medium text-clay-600 ring-1 ring-inset ring-clay-500/30">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="rounded-xl bg-moss-500/10 px-4 py-3 text-sm font-medium text-forest-700 ring-1 ring-inset ring-moss-500/30">
          {ok}
        </p>
      ) : null}
    </div>
  );
}

export function OccupancyBar({ filled, total }: { filled: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 90 ? "bg-clay-500" : pct >= 60 ? "bg-gold-500" : "bg-moss-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-ink-700/70">{pct}%</span>
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-forest-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-500 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGold =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-600 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-cream-100 px-4 py-2.5 text-sm font-semibold text-ink-800 ring-1 ring-inset ring-cream-300 transition hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 disabled:cursor-not-allowed disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-clay-500/10 px-4 py-2.5 text-sm font-semibold text-clay-600 ring-1 ring-inset ring-clay-500/30 transition hover:bg-clay-500/15 disabled:cursor-not-allowed disabled:opacity-50";

export const inputCls =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-inset ring-cream-300 placeholder:text-ink-700/40 focus:ring-2 focus:ring-forest-600";

export const textareaCls = cn(inputCls, "min-h-24 resize-y leading-relaxed");

export const labelCls =
  "block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/70";

export const selectCls = cn(inputCls, "pr-8");
