import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import {
  activeAllocation,
  checkInState,
  hostelById,
  roomById,
} from "@/lib/queries";
import { Badge, Card, PageHeader, Panel, StatTile } from "@/components/ui";
import { formatDate, money, semesterNow } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const STATUS_TEXT = {
  "not-checked-in": "Not checked in",
  "in-residence": "In residence",
  "checked-out": "Checked out",
} as const;

export default async function StudentDashboard() {
  const user = await requireRole(["student"]);
  const db = await readDb();
  const semester = semesterNow();
  const firstName = user.name.split(" ")[0];

  const allocation = activeAllocation(db, user.id, semester);
  const room = allocation ? roomById(db, allocation.roomId) : undefined;
  const hostel = allocation ? hostelById(db, allocation.hostelId) : undefined;
  const bed = room?.beds.find((b) => b.id === allocation?.bedId);
  const state = allocation ? checkInState(allocation) : null;

  const myPayments = db.payments.filter(
    (p) => p.studentId === user.id && p.semester === semester && p.status === "paid",
  );
  const paid = myPayments.reduce((n, p) => n + p.amount, 0);
  const receiptCount = db.receipts.filter((r) => myPayments.some((p) => p.id === r.paymentId)).length;

  const application = db.applications
    .filter((a) => a.studentId === user.id && a.semester === semester)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const transfer = db.transfers
    .filter((t) => t.studentId === user.id && t.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const myTickets = db.tickets.filter((t) => t.studentId === user.id);
  const openTickets = myTickets.filter((t) => t.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Karibuni, ${firstName}`}
        subtitle={`Your accommodation dashboard for ${semester}. Everything below updates live from the residence system.`}
        action={
          <Link
            href="/dashboard/room"
            className="rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-forest-600"
          >
            Open my key card
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Bed status"
          value={state ? STATUS_TEXT[state] : "Unallocated"}
          hint={hostel ? `${hostel.name} · ${room?.number}` : "Apply for a bed to get started"}
          tone={state === "in-residence" ? "dark" : "light"}
        />
        <StatTile
          label="Paid this semester"
          value={money(paid)}
          hint={paid >= 108000 ? "Semester settled in full" : `Balance due: ${money(Math.max(108000 - paid, 0))}`}
        />
        <StatTile
          label="Application"
          value={application ? application.status : "None"}
          hint={application ? `${hostel?.name ?? ""} ${hostel ? "·" : ""} submitted ${formatDate(application.createdAt)}` : "No application submitted yet"}
        />
        <StatTile
          label="Maintenance"
          value={String(openTickets)}
          hint={openTickets === 1 ? "open report of yours" : "open reports of yours"}
          tone="gold"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
            Your placement
          </p>
          {allocation && room && hostel ? (
            <>
              <p className="mt-3 font-display text-2xl text-ink-900">{hostel.name}</p>
              <p className="text-sm text-ink-700/70">
                Room {room.number} · {bed?.label} · {hostel.location}
              </p>
              <div className="mt-3">
                <Badge tone={state === "in-residence" ? "green" : state === "checked-out" ? "neutral" : "gold"}>
                  {STATUS_TEXT[state!]}
                </Badge>
              </div>
              <Link
                href="/dashboard/room"
                className="mt-4 inline-block text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
              >
                View QR key card →
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink-700/75">
                You do not hold a bed this semester. Submit an application and the hostel office
                will allocate you one.
              </p>
              <Link
                href="/dashboard/booking"
                className="mt-4 inline-block text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
              >
                Apply for a bed →
              </Link>
            </>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
            Money & receipts
          </p>
          <p className="mt-3 font-display text-3xl text-ink-900">{money(paid)}</p>
          <p className="text-sm text-ink-700/70">
            {receiptCount} receipt{receiptCount === 1 ? "" : "s"} issued with unique tracking
            numbers.
          </p>
          <p className="mt-3 text-xs text-ink-700/60">
            Monthly rate K27,000 · semester rate K108,000
          </p>
          <Link
            href="/dashboard/payments"
            className="mt-4 inline-block text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
          >
            Pay & view receipts →
          </Link>
        </Card>

        <Card className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
            Requests in flight
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-800">Accommodation application</span>
              <Badge tone={application?.status === "approved" ? "green" : application?.status === "rejected" ? "red" : application ? "gold" : "neutral"}>
                {application?.status ?? "none"}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-800">Room transfer</span>
              <Badge tone={transfer ? "gold" : "neutral"}>{transfer ? "pending" : "none"}</Badge>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-800">Maintenance reports</span>
              <Badge tone={openTickets > 0 ? "gold" : "green"}>{myTickets.length} total</Badge>
            </li>
          </ul>
          <Link
            href="/dashboard/transfers"
            className="mt-4 inline-block text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
          >
            Manage requests →
          </Link>
        </Card>
      </div>

      <Panel
        title="Residence notices"
        description="The newest activity across your hostel and the wider residence system."
      >
        <ul className="divide-y divide-cream-200">
          {db.tickets
            .filter((t) => t.status !== "resolved")
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 3)
            .map((ticket) => {
              const ticketRoom = roomById(db, ticket.roomId);
              const ticketHostel = ticketRoom ? hostelById(db, ticketRoom.hostelId) : undefined;
              return (
                <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {ticket.category} · {ticketHostel?.name} {ticketRoom?.number}
                    </p>
                    <p className="text-xs text-ink-700/65">{ticket.description}</p>
                  </div>
                  <Badge tone={ticket.status === "open" ? "gold" : "neutral"}>{ticket.status}</Badge>
                </li>
              );
            })}
          {db.complaints
            .slice(0, 2)
            .map((complaint) => (
              <li key={complaint.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Noise complaint · {hostelById(db, complaint.hostelId)?.name}
                  </p>
                  <p className="text-xs text-ink-700/65">{complaint.description}</p>
                </div>
                <Badge tone={complaint.status === "resolved" ? "green" : "neutral"}>
                  {complaint.status}
                </Badge>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
