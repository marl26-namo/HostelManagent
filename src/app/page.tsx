import QRCode from "qrcode";
import Link from "next/link";
import { BrandMark } from "@/components/nav";
import { OccupancyBar, StatTile } from "@/components/ui";
import { readDb } from "@/lib/db";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#hostels", label: "Hostels" },
  { href: "#how", label: "How it works" },
  { href: "#project", label: "The project" },
];

const SEVEN_FEATURES = [
  {
    title: "QR-code check-in & check-out",
    body: "Every allocation issues a digital key card. Guards scan it at the gate and the system records arrivals and departures in real time — no paper gate books.",
    icon: "qr",
    wide: true,
  },
  {
    title: "Photographic room inspections",
    body: "Inspectors upload dated photo evidence with every condition report, so disputes about room state are settled with images, not memory.",
    icon: "camera",
    wide: false,
  },
  {
    title: "Receipts with tracking numbers",
    body: "Each Airtel Money, TNM Mpamba or bank payment instantly issues a receipt carrying a unique tracking number that the office can verify.",
    icon: "receipt",
    wide: false,
  },
  {
    title: "Collective maintenance voting",
    body: "Residents second each other's repair reports. Tickets rise on real support counts, so the works team fixes what affects the most students first.",
    icon: "vote",
    wide: false,
  },
  {
    title: "Regulated room transfers",
    body: "Students request a transfer through the system; the hostel office approves it against live bed availability, and the move is recorded.",
    icon: "swap",
    wide: false,
  },
  {
    title: "Anonymous noise complaints",
    body: "Lodge a disturbance without attaching your name. The office sees the hostel, location and description — never the reporter.",
    icon: "bell",
    wide: false,
  },
  {
    title: "Digital lost & found",
    body: "One shared board for items lost around campus and the residences, with locations and contacts so belongings find their way home.",
    icon: "box",
    wide: true,
  },
];

function FeatureIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.4" />
        <path d="M14 14h3v3h-3zM19 19h2v2h-2zM14 19.5h2M19.5 14v2" />
      </>
    ),
    camera: (
      <>
        <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9z" />
        <circle cx="12" cy="13" r="3.2" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-1.6L12 21l-3-1.6L6 21V3z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    vote: (
      <>
        <path d="M12 4v9M12 13l-4-4M12 13l4-4" />
        <path d="M5 17h14M7 20h10" />
      </>
    ),
    swap: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
    bell: (
      <>
        <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z" />
        <path d="M10 18a2 2 0 0 0 4 0" />
      </>
    ),
    box: (
      <>
        <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z" />
        <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default async function LandingPage() {
  const db = readDb();

  const hostelStats = db.hostels.map((hostel) => {
    const rooms = db.rooms.filter((r) => r.hostelId === hostel.id);
    const beds = rooms.reduce((n, r) => n + r.beds.length, 0);
    const occupied = rooms.reduce(
      (n, r) => n + r.beds.filter((b) => b.occupantId).length,
      0,
    );
    return { hostel, beds, occupied, rooms: rooms.length };
  });

  const totalBeds = hostelStats.reduce((n, h) => n + h.beds, 0);
  const totalOccupied = hostelStats.reduce((n, h) => n + h.occupied, 0);

  const heroQr = await QRCode.toDataURL("MUBAS-CI:hero-pass:welcome-to-smart-hostel", {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#071713ff", light: "#ffffffff" },
  });

  return (
    <div className="overflow-x-hidden">
      {/* ---------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="leading-tight">
              <span className="block font-display text-[15px] text-cream-50">
                MUBAS Smart Hostel
              </span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-gold-400/90">
                Student Residence &amp; Housing
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-cream-100/75 transition hover:text-gold-400"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gold-400"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-ink-900 text-cream-100">
        <div className="absolute inset-0 grid-lines-dark" aria-hidden />
        <div className="absolute inset-x-0 top-0 h-[420px] glow-gold" aria-hidden />
        <div className="absolute inset-y-0 right-0 w-1/2 glow-moss" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-24 lg:pt-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-400">
              Malawi University of Business and Applied Sciences
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.06] text-cream-50 sm:text-5xl lg:text-[3.6rem]">
              Smart hostel booking &amp; management, built for{" "}
              <span className="text-gold-400">MUBAS</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-100/75 sm:text-lg">
              The current accommodation platform stops at issuing a booking ticket. This system
              carries students the rest of the way — allocation, mobile-money payments with
              verifiable receipts, QR-code gate check-in, photographic inspections, seconded
              repair reports, regulated transfers, anonymous noise complaints and a digital lost
              &amp; found, all in one portal.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/auth"
                className="rounded-xl bg-gold-500 px-6 py-3.5 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
              >
                Enter the portal
              </Link>
              <a
                href="#features"
                className="rounded-xl px-6 py-3.5 text-sm font-semibold text-cream-50 ring-1 ring-inset ring-cream-100/25 transition hover:bg-white/10"
              >
                See the seven features
              </a>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-cream-100/45">
              Students · Hostel administrators · Gate security
            </p>
          </div>

          {/* Key-card visual */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gold-500/10 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl bg-cream-50 text-ink-900 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
              <div className="flex items-start justify-between gap-3 border-b border-dashed border-cream-300 px-6 py-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-600">
                    Digital key card
                  </p>
                  <p className="mt-1.5 font-display text-xl">Chichiri Hostel</p>
                  <p className="text-sm text-ink-700/70">Room CH-02 · Bed 1</p>
                </div>
                <span className="rounded-full bg-forest-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cream-50">
                  In residence
                </span>
              </div>
              <div className="flex items-center gap-5 px-6 py-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroQr}
                  alt="Example QR check-in pass"
                  className="h-32 w-32 rounded-lg"
                />
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Defton Makwale</p>
                  <p className="text-xs leading-relaxed text-ink-700/70">
                    Scan at the gate to record arrival or departure.
                  </p>
                  <p className="font-mono text-[11px] tracking-wider text-gold-600">
                    MUBAS-CI:hero-pass
                  </p>
                </div>
              </div>
              <div className="rule-gold h-1 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- stats */}
      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-5">
        <div className="grid gap-4 rounded-3xl bg-cream-100 p-5 ring-1 ring-cream-300 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          <StatTile label="New students / year" value="9,000+" hint="across 130+ undergraduate programmes" />
          <StatTile label="Residences" value="8" hint="6 on-campus, 2 off-campus" />
          <StatTile label="Hostel fee" value={money(27000)} hint="per month · K108,000 per semester" />
          <StatTile label="New capabilities" value="7" hint="beyond today's booking platform" />
        </div>
      </section>

      {/* ------------------------------------------------------- problem */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-600">
            Why this system exists
          </p>
          <h2 className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
            A booking tool that stops where student residential life actually begins.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-700/75 sm:text-base">
            MUBAS already lets students apply for accommodation online. But once the ticket is
            issued, the process falls back to paper and phone calls. This project closes that gap
            with seven capabilities the current platform does not have.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-cream-300 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-clay-600">
              Today&apos;s platform
            </p>
            <ul className="mt-5 space-y-3.5 text-sm text-ink-800">
              {[
                "Acts as a booking and ticket-issuance tool only",
                "No digital check-in or check-out record",
                "Room inspections kept on paper, without photos",
                "Payments leave no verifiable receipt number",
                "Repairs tracked informally, with no resident feedback",
                "No formal channel for transfers or noise complaints",
                "Lost items handled through word of mouth",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-clay-500/10 text-xs font-bold text-clay-600">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-ink-900 p-6 text-cream-100 ring-1 ring-ink-800 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">
              This system adds
            </p>
            <ul className="mt-5 space-y-3.5 text-sm">
              {SEVEN_FEATURES.map((feature) => (
                <li key={feature.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-moss-500/25 text-xs font-bold text-gold-400">
                    ✓
                  </span>
                  <span>{feature.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ features */}
      <section id="features" className="bg-cream-100 py-20 ring-1 ring-cream-200">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-600">
                Seven capabilities, one portal
              </p>
              <h2 className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
                Everything the residence office and students need, together at last.
              </h2>
            </div>
            <Link
              href="/auth"
              className="rounded-xl bg-forest-700 px-5 py-3 text-sm font-semibold text-cream-50 transition hover:bg-forest-600"
            >
              Try it with a demo account
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SEVEN_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`group rounded-3xl bg-white p-6 ring-1 ring-cream-300 transition hover:-translate-y-1 hover:shadow-[0_28px_50px_-38px_rgba(7,23,19,0.7)] ${
                  feature.wide ? "md:col-span-2" : ""
                }`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest-700 text-gold-400 transition group-hover:bg-gold-500 group-hover:text-ink-900">
                  <FeatureIcon name={feature.icon} />
                </span>
                <h3 className="mt-5 text-lg text-ink-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700/75">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- hostels */}
      <section id="hostels" className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-600">
              Live occupancy
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
              Eight residences, bed-level visibility.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-700/75 sm:text-base">
              Nyika, Mpingwe and Ndirande A house male students; Hyrid, Kapeni and Ndirande B house
              female students; Chichiri and Poly Alley sit off-campus, predominantly hosting
              first-year students. Occupancy below is read live from the system:{" "}
              <strong className="text-ink-900">
                {totalOccupied} of {totalBeds} beds
              </strong>{" "}
              currently occupied.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {hostelStats.map(({ hostel, beds, occupied, rooms }) => (
              <article key={hostel.id} className="flex flex-col rounded-3xl bg-white p-5 ring-1 ring-cream-300">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg text-ink-900">{hostel.name}</h3>
                  <span className="rounded-full bg-cream-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-700">
                    {hostel.campus === "on-campus" ? "On-campus" : "Off-campus"}
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gold-600">
                  {hostel.gender === "male"
                    ? "Male only"
                    : hostel.gender === "female"
                      ? "Female only"
                      : "Open admission"}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700/75">
                  {hostel.description}
                </p>
                <p className="mt-4 text-xs text-ink-700/60">
                  {rooms} rooms · {occupied}/{beds} beds · {money(hostel.monthlyFee)}/month
                </p>
                <div className="mt-2">
                  <OccupancyBar filled={occupied} total={beds} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- how it works */}
      <section id="how" className="relative overflow-hidden bg-ink-900 py-20 text-cream-100">
        <div className="absolute inset-0 grid-lines-dark" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-400">
              How it works
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-cream-50 sm:text-4xl">
              From application to your key card, in four steps.
            </h2>
          </div>

          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Apply online",
                body: "Students apply at the end of each academic year, choosing preferred hostels from live availability.",
              },
              {
                title: "Office allocates",
                body: "The hostel office approves applications against free beds and assigns an exact room and bed.",
              },
              {
                title: "Pay & receive a receipt",
                body: "Pay K108,000 per semester by Airtel Money, TNM Mpamba or bank — a receipt with a unique tracking number is issued instantly.",
              },
              {
                title: "Scan to check in",
                body: "Your portal shows a QR key card. Guards scan it at the gate so check-in and check-out are recorded digitally.",
              },
            ].map((step, index) => (
              <li key={step.title} className="rounded-3xl bg-ink-800/70 p-6 ring-1 ring-cream-100/10">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-500 font-display text-lg font-bold text-ink-900">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg text-cream-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-100/70">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------- roles */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-600">
              Role-based access control
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
              Three roles, three tailored workspaces.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                role: "Student",
                points: [
                  "Apply for a bed and track the application",
                  "View allocation, roommates and QR key card",
                  "Pay fees and download tracked receipts",
                  "Report maintenance, second others' reports",
                  "Request transfers, report noise, post lost & found items",
                ],
              },
              {
                role: "Hostel administrator",
                points: [
                  "Approve applications and allocate beds",
                  "Monitor occupancy across all eight hostels",
                  "Operate the check-in console and review gate logs",
                  "Record inspections with photo evidence",
                  "Prioritise maintenance, review transfers and complaints",
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
            ].map((card, index) => (
              <article
                key={card.role}
                className={`rounded-3xl p-6 ring-1 ring-inset ${
                  index === 1
                    ? "bg-forest-700 text-cream-50 ring-forest-600"
                    : "bg-white text-ink-800 ring-cream-300"
                }`}
              >
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                    index === 1 ? "text-gold-400" : "text-gold-600"
                  }`}
                >
                  {card.role}
                </p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {card.points.map((point) => (
                    <li key={point} className="flex gap-2.5">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- project */}
      <section id="project" className="bg-cream-100 py-20 ring-1 ring-cream-200">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-8 rounded-[2rem] bg-ink-900 p-7 text-cream-100 ring-1 ring-ink-800 sm:p-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-400">
                About this project
              </p>
              <h2 className="mt-4 font-display text-2xl leading-snug text-cream-50 sm:text-3xl">
                A Smart Hostel Booking and Management System: A Case of the Malawi University of
                Business and Applied Sciences
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream-100/70">
                A Year 4 project developing a web-based system covering room allocation,
                maintenance reporting, QR-code check-in/check-out, room inspection, receipt
                generation and role-based access control — evaluated through user testing with
                students and administrators at MUBAS.
              </p>
            </div>
            <dl className="grid gap-4 self-center text-sm">
              {[
                ["Module", "CIT-PRJ-411 · Project"],
                ["Submitted by", "Defton Makwale"],
                ["Registration", "BIS/22/EP/015"],
                ["Department", "Computer Science & Information Systems"],
                ["Due date", "17 April 2026"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 border-b border-cream-100/10 pb-2">
                  <dt className="text-[11px] uppercase tracking-[0.16em] text-cream-100/50">{label}</dt>
                  <dd className="text-right font-medium text-cream-50">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="relative overflow-hidden rounded-[2rem] bg-forest-700 px-7 py-12 text-center text-cream-50 sm:px-12">
            <div className="absolute inset-0 glow-gold opacity-60" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl">Ready to check in?</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream-100/80 sm:text-base">
                Sign in to apply for a bed, pay your hostel fees, collect a tracked receipt and
                scan your digital key card at the gate.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/auth"
                  className="rounded-xl bg-gold-500 px-6 py-3.5 text-sm font-bold text-ink-900 transition hover:bg-gold-400"
                >
                  Sign in to the portal
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="rounded-xl px-6 py-3.5 text-sm font-semibold ring-1 ring-inset ring-cream-100/30 transition hover:bg-white/10"
                >
                  Create a student account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- footer */}
      <footer className="border-t border-cream-300 bg-cream-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="leading-tight">
              <p className="font-display text-sm text-ink-900">MUBAS Smart Hostel</p>
              <p className="text-xs text-ink-700/60">
                Student Residence &amp; Housing · Blantyre, Malawi
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-xs text-ink-700/70">
            <a href="#features" className="hover:text-forest-700">Features</a>
            <a href="#hostels" className="hover:text-forest-700">Hostels</a>
            <a href="#how" className="hover:text-forest-700">How it works</a>
            <Link href="/auth" className="hover:text-forest-700">Sign in</Link>
          </div>
          <p className="text-xs text-ink-700/50">
            Academic prototype · CIT-PRJ-411 · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
