"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" {...S} />
        <rect x="14" y="3" width="7" height="7" rx="1.5" {...S} />
        <rect x="3" y="14" width="7" height="7" rx="1.5" {...S} />
        <rect x="14" y="14" width="7" height="7" rx="1.5" {...S} />
      </>
    ),
    bed: (
      <>
        <path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" {...S} />
        <path d="M3 14h18M7 9V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" {...S} />
        <path d="M3 18v2M21 18v2" {...S} />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="8" r="4" {...S} />
        <path d="M11 11l8 8M16 16l2-2M19 19l2-2" {...S} />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2.5" {...S} />
        <path d="M3 10h18M16 14.5h2" {...S} />
      </>
    ),
    wrench: (
      <path
        d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L4 16.6V20h3.4l4.7-4.7a4.5 4.5 0 0 0 5.6-6l-2.7 2.7-2.6-.7-.7-2.6 2.7-2.7z"
        {...S}
      />
    ),
    swap: (
      <>
        <path d="M4 8h13l-3-3M20 16H7l3 3" {...S} />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" {...S} />
        <path d="M10 18a2 2 0 0 0 4 0" {...S} />
      </>
    ),
    box: (
      <>
        <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z" {...S} />
        <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" {...S} />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" {...S} />
        <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
    rooms: (
      <>
        <path d="M5 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" {...S} />
        <path d="M3 21h18M13 12.5h.01" {...S} />
      </>
    ),
    scan: (
      <>
        <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" {...S} />
        <path d="M4 12h16" {...S} />
      </>
    ),
    camera: (
      <>
        <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9z" {...S} />
        <circle cx="12" cy="13" r="3.2" {...S} />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" {...S} />
        <path d="M9 12l2 2 4-4" {...S} />
      </>
    ),
    clip: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" {...S} />
        <path d="M9 4.5h6M8.5 10h7M8.5 14h7M8.5 18h4" {...S} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] shrink-0">
      {paths[name] ?? paths.overview}
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl bg-gold-500 text-ink-900 shadow-[0_10px_24px_-16px_rgba(227,167,47,0.9)]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
        <path
          d="M6 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h16M14 12.5h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Sidebar({
  items,
  user,
  workspace,
}: {
  items: NavItem[];
  user: { name: string; roleLabel: string; email: string };
  workspace: string;
}) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <>
      <aside className="no-print sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-ink-900 text-cream-100 lg:flex">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <BrandMark />
          <div className="leading-tight">
            <p className="font-display text-[15px] text-cream-50">MUBAS Smart Hostel</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-400/80">{workspace}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    isActive(item)
                      ? "bg-gold-500 font-semibold text-ink-900"
                      : "text-cream-100/75 hover:bg-ink-800 hover:text-cream-50",
                  )}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-ink-800 px-5 py-4">
          <p className="truncate text-sm font-semibold text-cream-50">{user.name}</p>
          <p className="truncate text-xs text-cream-100/60">{user.email}</p>
          <p className="mb-3 mt-1 text-[11px] uppercase tracking-[0.16em] text-gold-400/90">
            {user.roleLabel}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-0 text-xs font-semibold uppercase tracking-[0.14em] text-cream-100/70 underline-offset-4 transition hover:text-gold-400 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile shell */}
      <header className="no-print sticky top-0 z-30 bg-ink-900 text-cream-100 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <div className="leading-tight">
              <p className="font-display text-sm text-cream-50">MUBAS Smart Hostel</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-gold-400/80">{workspace}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-100/75"
            >
              Sign out
            </button>
          </form>
        </div>
        <nav className="overflow-x-auto border-t border-ink-800">
          <ul className="flex min-w-max gap-1 px-3 py-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition",
                    isActive(item)
                      ? "bg-gold-500 text-ink-900"
                      : "text-cream-100/75 hover:bg-ink-800",
                  )}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
