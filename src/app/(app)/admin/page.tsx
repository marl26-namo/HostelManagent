import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { Badge, Card, PageHeader, StatTile } from "@/components/ui";
import { formatDateTime, money, semesterNow } from "@/lib/utils";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminDashboard() {
  const user = await requireRole(["admin"]);
  const db = readDb();
  const semester = semesterNow();

  const totalBeds = db.rooms.reduce((n, r) => n + r.beds.length, 0);
  const occupied = db.rooms.reduce(
    (n, r) => n + r.beds.filter((b) => b.occupantId !== null).length,
    0,
  );
  const pendingApps = db.applications.filter((a) => a.status === "pending").length;
  const pendingTransfers = db.transfers.filter((t) => t.status === "pending").length;
  const newComplaints = db.complaints.filter((c) => c.status === "new").length;
  const openTickets = db.tickets.filter((t) => t.status !== "resolved").length;
  const collected = db.payments
    .filter((p) => p.status === "paid" && p.semester === semester)
    .reduce((n, p) => n + p.amount, 0);
  const recentEvents = [...db.checkEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const recentApplications = [...db.applications]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const attention: Array<{ label: string; count: number; href: string; tone: "gold" | "red" | "green" }> = [
    { label: "Applications awaiting review", count: pendingApps, href: "/admin/applications", tone: "gold" },
    { label: "Transfer requests pending", count: pendingTransfers, href: "/admin/transfers", tone: "gold" },
    { label: "Maintenance reports active", count: openTickets, href: "/admin/maintenance", tone: "red" },
    { label: "New noise complaints", count: newComplaints, href: "/admin/complaints", tone: "red" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel office"
        subtitle={`Live overview of the MUBAS residence system for ${semester}. Signed in as ${user.name}.`}
        action={
          <Link
            href="/admin/checkins"
            className="rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-forest-600"
          >
            Open gate console
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Occupancy"
          value={`${Math.round((occupied / Math.max(totalBeds, 1)) * 100)}%`}
          hint={`${occupied} of ${totalBeds} beds occupied`}
          tone="dark"
        />
        <StatTile label="Pending applications" value={String(pendingApps)} hint="awaiting your review" tone="gold" />
        <StatTile label="Active maintenance" value={String(openTickets)} hint="reports not yet resolved" />
        <StatTile label="Collected this semester" value={money(collected)} hint={`${db.receipts.length} receipts issued overall`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
            Needs your attention
          </p>
          <ul className="mt-4 divide-y divide-cream-200">
            {attention.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 py-3 transition hover:text-forest-700"
                >
                  <span className="text-sm text-ink-800">{item.label}</span>
                  <Badge tone={item.count === 0 ? "green" : item.tone}>
                    {item.count === 0 ? "clear" : item.count}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
              Latest gate activity
            </p>
            <Link href="/admin/checkins" className="text-xs font-semibold text-forest-700 hover:underline">
              Full log →
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="mt-4 text-sm text-ink-700/70">No check-in scans recorded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-cream-200">
              {recentEvents.map((event) => {
                const allocation = db.allocations.find((a) => a.id === event.allocationId);
                const student = allocation
                  ? db.users.find((u) => u.id === allocation.studentId)
                  : undefined;
                return (
                  <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{student?.name ?? "Unknown"}</p>
                      <p className="text-xs text-ink-700/60">{formatDateTime(event.at)}</p>
                    </div>
                    <Badge tone={event.type === "in" ? "green" : "neutral"}>
                      {event.type === "in" ? "Arrival" : "Departure"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-600">
            Newest applications
          </p>
          <Link href="/admin/applications" className="text-xs font-semibold text-forest-700 hover:underline">
            Review all →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-cream-200">
          {recentApplications.map((application) => {
            const student = db.users.find((u) => u.id === application.studentId);
            const hostel = db.hostels.find((h) => h.id === application.hostelId);
            return (
              <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{student?.name ?? "Unknown"}</p>
                  <p className="text-xs text-ink-700/60">
                    {student?.regNumber ?? "—"} · {hostel?.name} · {formatDateTime(application.createdAt)}
                  </p>
                </div>
                <Badge
                  tone={
                    application.status === "approved"
                      ? "green"
                      : application.status === "rejected"
                        ? "red"
                        : "gold"
                  }
                >
                  {application.status}
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
