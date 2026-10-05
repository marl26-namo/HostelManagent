import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { Flash, PageHeader } from "@/components/ui";
import { BookingSection, ApplicationsSection } from "@/components/sections/booking";
import { RoomSection, RoomsSection } from "@/components/sections/room";
import { PaymentsSection, PaymentsAdminSection } from "@/components/sections/payments";
import { MaintenanceSection, MaintenanceAdminSection } from "@/components/sections/maintenance";
import { TransfersSection, TransfersAdminSection } from "@/components/sections/transfers";
import { ComplaintsSection, ComplaintsAdminSection } from "@/components/sections/complaints";
import { LostFoundSection, LostFoundAdminSection } from "@/components/sections/lost-found";
import { CheckinsSection } from "@/components/sections/checkins";
import { CheckinPassSection } from "@/components/sections/checkin-pass";
import { InspectionsSection } from "@/components/sections/inspections";
import { StudentsAdminSection } from "@/components/sections/students";
import type { User } from "@/lib/types";

interface Header {
  title: string;
  subtitle: string;
  student: string;
  admin: string;
}

const SECTIONS: Record<string, Header> = {
  booking: {
    title: "Book a room",
    subtitle: "Live availability across all eight residences — apply and let the hostel office allocate your bed.",
    student: "booking",
    admin: "applications",
  },
  room: {
    title: "My room & key card",
    subtitle: "Your allocation, roommates and the QR pass guards scan at the gate.",
    student: "room",
    admin: "rooms",
  },
  payments: {
    title: "Payments & receipts",
    subtitle: "Pay hostel rent by Airtel Money, TNM Mpamba or bank transfer and keep every tracked receipt.",
    student: "payments",
    admin: "payments",
  },
  maintenance: {
    title: "Maintenance",
    subtitle: "Report problems with photos and second your neighbours' reports so real issues rise to the top.",
    student: "maintenance",
    admin: "maintenance",
  },
  transfers: {
    title: "Room transfer",
    subtitle: "Request a move to another hostel — the office reviews it against live bed availability.",
    student: "transfers",
    admin: "transfers",
  },
  complaints: {
    title: "Noise complaints",
    subtitle: "Report disturbances anonymously; no identity is ever recorded with a complaint.",
    student: "complaints",
    admin: "complaints",
  },
  "lost-found": {
    title: "Lost & found",
    subtitle: "One shared board for belongings lost and found around the residences and campus.",
    student: "lost-found",
    admin: "lost-found",
  },
  checkin: {
    title: "Check-in pass",
    subtitle: "Your QR gate pass, residency status and every scan recorded against it.",
    student: "checkin",
    admin: "checkin",
  },
  students: {
    title: "Student accounts",
    subtitle: "Issue portal logins for students — there is no public sign-up.",
    student: "room",
    admin: "students",
  },
  checkins: {
    title: "Gate console",
    subtitle: "Scan QR key cards to record arrivals and departures, with a full gate log.",
    student: "room",
    admin: "checkins",
  },
  inspections: {
    title: "Room inspections",
    subtitle: "Record room condition with photographic evidence for every inspection cycle.",
    student: "room",
    admin: "inspections",
  },
};

const STUDENT_KEYS = ["booking", "room", "checkin", "payments", "maintenance", "transfers", "complaints", "lost-found"];
const ADMIN_KEYS = [
  "students",
  "applications",
  "rooms",
  "checkins",
  "inspections",
  "maintenance",
  "transfers",
  "complaints",
  "lost-found",
  "payments",
];

type Kind = "student" | "admin";

function findKey(section: string, kind: Kind): string | null {
  if (kind === "student") {
    if (!STUDENT_KEYS.includes(section)) return null;
    return section;
  }
  if (!ADMIN_KEYS.includes(section)) return null;
  return (Object.keys(SECTIONS) as string[]).find((key) => SECTIONS[key].admin === section) ?? null;
}

function renderSection(key: string, user: User) {
  const isAdmin = user.role === "admin";
  // Dispatch on the resolved section key, not the student-side alias: checkins
  // and inspections share the "room" alias on the student side but must render
  // their own admin consoles.
  switch (key) {
    case "booking":
      return isAdmin ? <ApplicationsSection /> : <BookingSection user={user} />;
    case "room":
      return isAdmin ? <RoomsSection /> : <RoomSection user={user} />;
    case "payments":
      return isAdmin ? <PaymentsAdminSection /> : <PaymentsSection user={user} />;
    case "maintenance":
      return isAdmin ? <MaintenanceAdminSection /> : <MaintenanceSection user={user} />;
    case "transfers":
      return isAdmin ? <TransfersAdminSection /> : <TransfersSection user={user} />;
    case "complaints":
      return isAdmin ? <ComplaintsAdminSection /> : <ComplaintsSection />;
    case "lost-found":
      return isAdmin ? <LostFoundAdminSection /> : <LostFoundSection user={user} />;
    case "checkin":
      return isAdmin ? null : <CheckinPassSection user={user} />;
    case "students":
      return isAdmin ? <StudentsAdminSection /> : null;
    case "checkins":
      return <CheckinsSection />;
    case "inspections":
      return isAdmin ? <InspectionsSection /> : <RoomSection user={user} />;
    default:
      return null;
  }
}

export async function sectionTitle(section: string, kind: Kind): Promise<string> {
  const key = findKey(section, kind);
  return key ? SECTIONS[key].title : "Portal";
}

export default async function SectionPage({
  params,
  searchParams,
  kind,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  kind: Kind;
}) {
  const { section } = await params;
  const sp = await searchParams;
  const key = findKey(section, kind);
  if (!key) notFound();

  const user =
    kind === "admin" ? await requireRole(["admin"]) : await requireRole(["student"]);
  const header = SECTIONS[key];
  const error = typeof sp.error === "string" ? sp.error : null;
  const ok = typeof sp.ok === "string" ? sp.ok : null;

  return (
    <div>
      <PageHeader title={header.title} subtitle={header.subtitle} />
      <Flash error={error} ok={ok} />
      {renderSection(key, user)}
    </div>
  );
}
