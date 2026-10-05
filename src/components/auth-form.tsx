"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { signInAction } from "@/lib/actions";
import { btnGold, inputCls, labelCls } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * One login form for the whole system. Students, hostel administrators and gate
 * security all sign in here; the role on the issued account decides which portal
 * dashboard opens afterwards.
 *
 * There is no public sign-up: the hostel office creates student accounts and
 * hands the credentials over, so account creation lives in the admin portal.
 */
const DEMO_ACCOUNTS = [
  { role: "Student", portal: "Student portal", email: "student@mubas.ac.mw", password: "student123" },
  { role: "Hostel administrator", portal: "Admin portal", email: "admin@mubas.ac.mw", password: "admin123" },
  { role: "Gate security", portal: "Gate console", email: "guard@mubas.ac.mw", password: "guard123" },
];

export function AuthForm({ returnTo }: { returnTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signState, doSignIn] = useActionState(signInAction, {});

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-ink-900 px-10 py-12 text-cream-100 lg:flex lg:flex-col">
        <div className="absolute inset-0 grid-lines-dark" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-80 glow-gold" aria-hidden />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-500 text-ink-900">
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
            <span className="leading-tight">
              <span className="block font-display text-base text-cream-50">MUBAS Smart Hostel</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-gold-400/90">
                Student Residence &amp; Housing
              </span>
            </span>
          </Link>

          <h1 className="mt-14 max-w-md font-display text-4xl leading-tight text-cream-50">
            Three portals, one login.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-cream-100/70">
            The same sign-in form opens the right workspace for your role — the student app, the
            hostel administration dashboard, or the gate console.
          </p>

          <ul className="mt-10 space-y-3 text-sm">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3 text-cream-100/85">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-moss-500/25 text-xs font-bold text-gold-400">
                    ✓
                  </span>
                  {account.role}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-cream-100/45">
                  {account.portal}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-auto pt-10 text-xs uppercase tracking-[0.18em] text-cream-100/40">
          CIT-PRJ-411 · Year 4 Project · Defton Makwale
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
            ← Back to home
          </Link>

          <h2 className="mt-5 font-display text-3xl text-ink-900">Sign in to your portal</h2>
          <p className="mt-2 text-sm text-ink-700/70">
            Use the credentials issued to you. Student accounts are created by the hostel office —
            there is no public sign-up.
          </p>

          {signState.error ? (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-clay-500/10 px-4 py-3 text-sm font-medium text-clay-600 ring-1 ring-inset ring-clay-500/30"
            >
              {signState.error}
            </p>
          ) : null}

          <form action={doSignIn} className="mt-6 space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div>
              <label className={labelCls} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mubas.ac.mw"
                className={cn(inputCls, "mt-2")}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(inputCls, "mt-2")}
              />
            </div>
            <button type="submit" className={cn(btnGold, "w-full py-3")}>
              Sign in
            </button>
          </form>

          <div className="mt-8 rounded-2xl bg-white p-4 ring-1 ring-cream-300">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-700/60">
              Demo accounts — tap to fill
            </p>
            <div className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-cream-50 px-3.5 py-2.5 text-left text-sm ring-1 ring-cream-200 transition hover:bg-cream-100 hover:ring-forest-600"
                >
                  <span className="font-semibold text-ink-800">{account.role}</span>
                  <span className="truncate font-mono text-xs text-ink-700/60">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}