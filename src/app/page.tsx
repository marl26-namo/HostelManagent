import QRCode from "qrcode";
import Link from "next/link";
import { BrandMark } from "@/components/nav";
import { OccupancyBar, StatTile } from "@/components/ui";
import { readDb } from "@/lib/db";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEVEN_FEATURES = [
  {
    title: "QR-code check-in & check-out",
    body: "Every allocation issues a digital key card. Guards scan it at the gate and arrivals are recorded in real time — no paper gate books.",
  },
  {
    title: "Photographic room inspections",
    body: "Inspectors upload dated photo evidence with every condition report, so disputes about room state are settled with images.",
  },
  {
    title: "Receipts with tracking numbers",
    body: "Each Airtel Money, TNM Mpamba or bank payment instantly issues a receipt carrying a unique tracking number.",
  },
  {
    title: "Collective maintenance voting",
    body: "Residents second each other's repair reports, so the works team fixes what affects the most students first.",
  },
  {
    title: "Regulated room transfers",
    body: "Students request a transfer through the system; the office approves it against live bed availability.",
  },
  {
    title: "Anonymous noise complaints",
    body: "Lodge a disturbance without attaching your name. The office sees the hostel, location and description only.",
  },
  {
    title: "Digital lost & found",
    body: "One shared board for items lost around campus and the residences, with locations and contacts.",
  },
];

const STEPS = [
  { title: "Apply online", body: "Students apply at the end of each academic year, choosing preferred hostels from live availability." },
  { title: "Office allocates", body: "The hostel office approves the application and assigns an exact room and bed." },
  { title: "Pay & collect", body: "Pay K108,000 per semester by mobile money or bank — a tracked receipt is issued instantly." },
  { title: "Scan to check in", body: "Your portal shows a QR key card. Guards scan it at the gate to record arrival and departure." },
];

const ROLES = [
  {
    role: "Student",
    points: [
      "Apply for a bed and track the application",
      "View allocation, roommates and QR key card",
      "Pay fees and download tracked receipts",
      "Report maintenance and second other reports",
      "Request transfers, report noise, post lost & found",
    ],
  },
  {
    role: "Hostel administrator",
    points: [
      "Approve applications and allocate beds",
      "Monitor occupancy across all eight hostels",
      "Operate the check-in console and gate log",
      "Record inspections with photo evidence",
      "Prioritise maintenance, transfers and complaints",
    ],
  },
  {
    role: "Gate security",
    points: [
      "Scan student QR key cards at the gate",
      "Record arrivals and departures in one tap",
      "See room, hostel and residency status instantly",
      "No access to payments or student records",
    ],
  },
];

const PROJECT_DETAILS: Array<[string, string]> = [
  ["Module", "CIT-PRJ-411 · Project"],
  ["Submitted by", "Defton Makwale"],
  ["Registration", "BIS/22/EP/015"],
  ["Department", "Computer Science & Information Systems"],
  ["Due date", "17 April 2026"],
];

export default async function LandingPage() {
  const db = await readDb();

  const stats = db.hostels.map((hostel) => {
    const rooms = db.rooms.filter((r) => r.hostelId === hostel.id);
    const beds = rooms.reduce((n, r) => n + r.beds.length, 0);
    const occupied = rooms.reduce((n, r) => n + r.beds.filter((b) => b.occupantId).length, 0);
    return { hostel, beds, occupied, rooms: rooms.length };
  });

  const totalBeds = stats.reduce((n, s) => n + s.beds, 0);
  const totalOccupied = stats.reduce((n, s) => n + s.occupied, 0);

  const heroQr = await QRCode.toDataURL("MUBAS-CI:hero-pass:welcome-to-smart-hostel", {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#0a1330ff", light: "#ffffffff" },
  });

  return (
    <div className="min-h-screen bg-cream-50 pb-10">
      {/* ---------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block font-display text-[15px] text-ink-900">MUBAS Smart Hostel</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-gold-600">
                Residence &amp; Housing
              </span>
            </span>
          </Link>
          <Link
            href="/auth"
            className="rounded-full bg-forest-700 px-4 py-2 text-sm font-semibold text-cream-50 transition hover:bg-forest-600"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* --------------------------------------------------------- hero */}
      <section className="px-4 pt-5 sm:px-5">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-ink-900 text-cream-50 shadow-[0_30px_60px_-40px_rgba(10,19,48,0.9)]">
          <div className="absolute inset-0 grid-lines-dark" aria-hidden />
          <div className="absolute inset-x-0 top-0 h-64 glow-gold" aria-hidden />

          <div className="relative p-5 sm:p-8 lg:p-12">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-400">
                Malawi University of Business &amp; Applied Sciences
              </p>
              <Link
                href="#hostels"
                className="shrink-0 rounded-full bg-ink-800/80 px-3 py-1.5 text-xs font-medium text-cream-100 ring-1 ring-inset ring-cream-100/20"
              >
                360° view hostels
              </Link>
            </div>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <h1 className="font-display text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
                  Smart hostel booking, built for <span className="text-gold-400">MUBAS</span>.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream-100/75 sm:text-base">
                  Apply for a bed, pay your hostel rent and collect a tracked receipt — then scan
                  your digital key card at the gate. Check-ins, inspections, repairs and transfers
                  all in one portal.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/auth"
                    className="rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
                  >
                    Book a bed
                  </Link>
                  <Link
                    href="/auth"
                    className="rounded-full px-6 py-3 text-sm font-semibold text-cream-50 ring-1 ring-inset ring-cream-100/30 transition hover:bg-white/10"
                  >
                    Sign in to the portal
                  </Link>
                </div>
              </div>

              {/* Key-card visual, echoing the app's digital pass */}
              <div className="rounded-3xl bg-cream-50 p-4 text-ink-900 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.7)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">
                      Digital key card
                    </p>
                    <p className="mt-1 font-display text-lg">Chichiri Hostel</p>
                    <p className="text-xs text-ink-700/70">Room CH-02 · Bed 1</p>
                  </div>
                  <span className="rounded-full bg-forest-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cream-50">
                    In residence
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroQr} alt="Example QR check-in pass" className="h-24 w-24 rounded-xl" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Scan at the gate</p>
                    <p className="text-xs leading-relaxed text-ink-700/70">
                      Your arrival and departure are logged instantly.
                    </p>
                    <p className="font-mono text-[10px] tracking-wide text-gold-600">
                      MUBAS-CI:hero-pass
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- search + categories */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-5">
        <Link
          href="#hostels"
          className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm text-ink-700/70 ring-1 ring-cream-300 transition hover:ring-cream-200"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-ink-700/60" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          Search hostels, rooms and residence services
        </Link>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {["Hostel", "On-campus", "Off-campus", "Male", "Female", "Free beds"].map((chip, index) => (
            <a
              key={chip}
              href="#hostels"
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                index === 0
                  ? "bg-ink-900 text-cream-50"
                  : "bg-white text-ink-700 ring-1 ring-cream-300 hover:bg-cream-100"
              }`}
            >
              {chip}
            </a>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- stats */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="New students / year" value="9,000+" hint="across 130+ programmes" />
          <StatTile label="Residences" value="8" hint="6 on-campus, 2 off-campus" />
          <StatTile label="Hostel fee" value={money(27000)} hint="per month · K108,000 per semester" />
          <StatTile label="New capabilities" value="7" hint="beyond today's booking platform" tone="gold" />
        </div>
      </section>

      {/* ------------------------------------------------------ hostels */}
      <section id="hostels" className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-600">
              Live occupancy
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight text-ink-900 sm:text-3xl">
              Book your residence
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink-700/75">
              Eight residences, bed-level availability.{" "}
              <strong className="text-ink-900">
                {totalOccupied} of {totalBeds} beds
              </strong>{" "}
              currently occupied.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ hostel, beds, occupied, rooms }) => {
            const amenities = hostel.amenities ?? ["Security", "Wi-Fi", "Laundry"];
            return (
              <article
                key={hostel.id}
                className="overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200 transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-34px_rgba(10,19,48,0.65)]"
              >
                <div className="media-card relative h-36">
                  <span className="absolute left-4 top-3 font-display text-sm text-cream-50/90">
                    {hostel.name}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-300">
                    ★ {hostel.rating ?? 4}
                  </span>
                  <span className="absolute bottom-3 left-4 rounded-full bg-cream-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-700">
                    {hostel.campus === "on-campus" ? "On-campus" : "Off-campus"} ·{" "}
                    {hostel.gender === "open" ? "Open" : hostel.gender}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-bold text-ink-900">
                    {beds - occupied} free
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="text-base font-semibold text-ink-900">{hostel.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-700/65">{hostel.location}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-medium text-ink-700"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <OccupancyBar filled={occupied} total={beds} />
                    <p className="mt-1.5 text-[11px] text-ink-700/60">
                      {rooms} rooms · {occupied}/{beds} beds
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink-900">
                      {money(hostel.monthlyFee)}
                      <span className="text-[11px] font-normal text-ink-700/60">/month</span>
                    </p>
                    <Link
                      href="/auth"
                      className="rounded-full bg-forest-700 px-4 py-2 text-xs font-bold text-cream-50 transition hover:bg-forest-600"
                    >
                      Book now
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* --------------------------------------------------- how it works */}
      <section className="bg-ink-900 py-12 text-cream-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-400">
            How it works
          </p>
          <h2 className="mt-2 font-display text-2xl text-cream-50 sm:text-3xl">
            From application to key card, in four steps.
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-3xl bg-ink-800/70 p-5 ring-1 ring-cream-100/10">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-500 font-display text-sm font-bold text-ink-900">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-base text-cream-50">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cream-100/70">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-12 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-600">
              Seven capabilities, one portal
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
              What the current booking platform still cannot do
            </h2>
          </div>
          <Link
            href="/auth"
            className="rounded-full bg-forest-700 px-5 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-forest-600"
          >
            Try a demo account
          </Link>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEVEN_FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-3xl bg-white p-5 ring-1 ring-cream-200"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-500 text-sm font-bold text-ink-900">
                ✓
              </span>
              <h3 className="mt-3 text-base text-ink-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700/75">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- roles */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-600">
          Role-based access control
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl">
          Three roles, three tailored workspaces.
        </h2>
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {ROLES.map((card, index) => (
            <article
              key={card.role}
              className={`rounded-3xl p-5 ring-1 ${
                index === 1 ? "bg-forest-700 text-cream-50" : "bg-white text-ink-800"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
                {card.role}
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {card.points.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- project */}
      <section className="bg-cream-100 py-12 ring-1 ring-cream-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="grid gap-6 rounded-[28px] bg-ink-900 p-6 text-cream-100 sm:p-9 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-400">
                About this project
              </p>
              <h2 className="mt-3 font-display text-2xl leading-snug text-cream-50">
                A Smart Hostel Booking and Management System: A Case of the Malawi University of
                Business and Applied Sciences
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream-100/70">
                A Year 4 project developing a web-based system covering room allocation,
                maintenance reporting, QR-code check-in, room inspection, receipt generation and
                role-based access control.
              </p>
            </div>
            <dl className="grid gap-3 self-center text-sm">
              {PROJECT_DETAILS.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-cream-100/10 pb-2"
                >
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-cream-100/50">{label}</dt>
                  <dd className="text-right font-medium text-cream-50">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-5">
        <div className="rounded-[28px] bg-forest-700 px-6 py-10 text-center text-cream-50">
          <h2 className="font-display text-2xl sm:text-3xl">Ready to check in?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-cream-100/80">
            Sign in to apply for a bed, pay your hostel fees, collect a tracked receipt and scan
            your key card at the gate.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth"
              className="rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
            >
              Sign in to the portal
            </Link>
            <Link
              href="/auth"
              className="rounded-full px-6 py-3 text-sm font-semibold ring-1 ring-inset ring-cream-100/30 transition hover:bg-white/10"
            >
              Sign in with your issued account
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- footer */}
      <footer className="border-t border-cream-200 px-4 py-8 sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <div className="leading-tight">
              <p className="font-display text-sm text-ink-900">MUBAS Smart Hostel</p>
              <p className="text-xs text-ink-700/60">Student Residence &amp; Housing · Blantyre, Malawi</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-ink-700/70">
            <a href="#hostels" className="hover:text-forest-700">Hostels</a>
            <a href="#features" className="hover:text-forest-700">Features</a>
            <Link href="/auth" className="hover:text-forest-700">Sign in</Link>
          </div>
          <p className="text-xs text-ink-700/50">Academic prototype · CIT-PRJ-411 · © 2026</p>
        </div>
      </footer>
    </div>
  );
}