"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-cream-100 px-3 py-1.5 text-xs font-semibold text-ink-800 ring-1 ring-inset ring-cream-300 transition hover:bg-cream-200"
    >
      {label}
    </button>
  );
}
