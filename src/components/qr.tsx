"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { scanCheckIn } from "@/lib/actions";
import type { ScanResult } from "@/lib/types";
import { btnGold, btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";
import { cn } from "@/lib/utils";

export function QrPass({
  payload,
  studentName,
  roomLine,
  hostelName,
  statusLabel,
}: {
  payload: string;
  studentName: string;
  roomLine: string;
  hostelName: string;
  statusLabel: string;
}) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(payload, {
      margin: 1,
      width: 360,
      errorCorrectionLevel: "M",
      color: { dark: "#071713ff", light: "#ffffffff" },
    })
      .then((data) => {
        if (alive) setSrc(data);
      })
      .catch(() => {
        if (alive) setSrc("");
      });
    return () => {
      alive = false;
    };
  }, [payload]);

  return (
    <div className="overflow-hidden rounded-2xl bg-ink-900 text-cream-100 shadow-[0_24px_50px_-34px_rgba(7,23,19,0.9)]">
      <div className="flex items-start justify-between gap-4 border-b border-dashed border-cream-100/20 px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold-400">Digital key card</p>
          <p className="mt-1 font-display text-xl text-cream-50">{hostelName}</p>
          <p className="text-sm text-cream-100/70">{roomLine}</p>
        </div>
        <span className="rounded-full bg-gold-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-900">
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center gap-5 px-5 py-5">
        <div className="rounded-xl bg-white p-2.5">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`Check-in QR code for ${studentName}`} className="h-36 w-36" />
          ) : (
            <div className="grid h-36 w-36 place-items-center bg-cream-100 text-xs text-ink-700/60">
              Generating…
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <p className="font-semibold text-cream-50">{studentName}</p>
          <p className="break-all text-cream-100/60">
            Present this code at the gate. Guards scan it to record arrival or departure.
          </p>
          <p className="font-mono text-xs tracking-wider text-gold-400">{payload}</p>
        </div>
      </div>
    </div>
  );
}

type Direction = "in" | "out";

export function CheckInConsole() {
  const [direction, setDirection] = useState<Direction>("in");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [note, setNote] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  async function submit(formData: FormData) {
    const code = String(formData.get("code") ?? "").trim();
    if (!code) {
      setResult({ ok: false, message: "No code entered", detail: "Scan a pass or paste its code." });
      return;
    }
    formData.set("direction", direction);
    setResult(await scanCheckIn(formData));
  }

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer = 0;

    const detectorCtor = (
      window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => {
          detect(video: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
        };
      }
    ).BarcodeDetector;

    (async () => {
      if (!detectorCtor) {
        setNote("This browser can't scan QR codes with the camera — enter the code manually.");
        setScanning(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new detectorCtor({ formats: ["qr_code"] });
        timer = window.setInterval(async () => {
          if (!videoRef.current || cancelled) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const value = codes[0].rawValue;
              window.clearInterval(timer);
              setScanning(false);
              const fd = new FormData();
              fd.set("code", value);
              fd.set("direction", direction);
              setResult(await scanCheckIn(fd));
            }
          } catch {
            /* frame not ready */
          }
        }, 500);
      } catch {
        setNote("Camera unavailable or permission denied — enter the code manually.");
        setScanning(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, direction]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-ink-900 p-5 text-cream-100 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold-400">Gate console</p>
        <h2 className="mt-1 font-display text-2xl text-cream-50">Scan a student pass</h2>
        <p className="mt-1 text-sm text-cream-100/65">
          Point the camera at the QR key card, or type the code printed under it.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <fieldset>
            <legend className={cn(labelCls, "text-cream-100/60 mb-2")}>Movement</legend>
            <div className="flex rounded-xl bg-ink-800 p-1">
              {(["in", "out"] as Direction[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold transition",
                    direction === d
                      ? "bg-gold-500 text-ink-900"
                      : "text-cream-100/70 hover:text-cream-50",
                  )}
                >
                  {d === "in" ? "Arriving" : "Departing"}
                </button>
              ))}
            </div>
          </fieldset>

          <form id="scan-form" action={submit} className="space-y-1.5">
            <label className={cn(labelCls, "text-cream-100/60")} htmlFor="scan-code">
              QR payload
            </label>
            <input
              id="scan-code"
              name="code"
              autoComplete="off"
              placeholder="MUBAS-CI:al_xxxxx:c0de0001beef"
              className={cn(inputCls, "border-0 bg-white/95 font-mono text-xs")}
            />
          </form>

          <div className="flex gap-2">
            <button type="submit" form="scan-form" className={btnGold}>
              {direction === "in" ? "Check in" : "Check out"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNote("");
                setScanning(true);
              }}
              className={cn(btnSecondary, "bg-ink-800 text-cream-100 ring-ink-700 hover:bg-ink-700")}
            >
              Camera
            </button>
          </div>
        </div>

        {note ? <p className="mt-4 text-sm text-gold-300">{note}</p> : null}

        {scanning ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-ink-700">
            <video ref={videoRef} playsInline muted className="aspect-video w-full bg-black object-cover" />
            <div className="flex items-center justify-between bg-ink-800 px-4 py-2 text-xs text-cream-100/70">
              <span>Looking for a QR code…</span>
              <button
                type="button"
                onClick={() => setScanning(false)}
                className="font-semibold text-gold-400 hover:underline"
              >
                Stop camera
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {result ? (
        <div
          className={cn(
            "rounded-2xl px-5 py-4 ring-1 ring-inset",
            result.ok
              ? "bg-moss-500/10 text-forest-700 ring-moss-500/30"
              : "bg-clay-500/10 text-clay-600 ring-clay-500/30",
          )}
          role="status"
        >
          <p className="font-display text-xl">{result.message}</p>
          {result.detail ? <p className="mt-1 text-sm opacity-80">{result.detail}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
