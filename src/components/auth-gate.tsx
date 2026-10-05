"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BrandMark } from "./nav";

export function AuthGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(`/auth?returnTo=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  return (
    <div className="grid min-h-screen place-items-center bg-ink-900 text-cream-100">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark className="h-12 w-12" />
        <p className="font-display text-xl text-cream-50">Redirecting to sign in…</p>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400/80">
          MUBAS Smart Hostel
        </p>
      </div>
    </div>
  );
}
