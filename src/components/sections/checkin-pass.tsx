import Link from "next/link";
import { QrPass } from "@/components/qr";
import { Badge, EmptyState, Panel } from "@/components/ui";
import { readDb } from "@/lib/db";
import { activeAllocation, checkInState, hostelById, roomById } from "@/lib/queries";
import type { User } from "@/lib/types";
import { formatDateTime, semesterNow } from "@/lib/utils";

const STATUS_TEXT = {
  "not-checked-in": "Not checked in",
  "in-residence": "In residence",
  "checked-out": "Checked out",
} as const;

/**
 * Student "Check-in" tab: the digital pass scanned at the gate, the current
 * residency status and the student's own arrival/departure history.
 */
export async function CheckinPassSection({ user }: { user: User }) {
  const db = await readDb();
  const semester = semesterNow();
  const allocation = activeAllocation(db, user.id, semester);
  const room = allocation ? roomById(db, allocation.roomId) : undefined;
  const hostel = allocation ? hostelById(db, allocation.hostelId) : undefined;
  const bed = room?.beds.find((b) => b.id === allocation?.bedId);

  if (!allocation || !room || !hostel) {
    return (
      <Panel title="Gate pass" description="Your QR pass appears once the hostel office allocates you a bed.">
        <EmptyState
          title="No bed allocated yet"
          body="Apply for accommodation and the hostel office will allocate a room, after which your check-in pass is issued here."
        />
        <div className="mt-5">
          <Link
            href="/dashboard/booking"
            className="rounded-xl bg-forest-700 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-600"
          >
            Apply for a bed
          </Link>
        </div>
      </Panel>
    );
  }

  const state = checkInState(allocation);
  const payload = `MUBAS-CI:${allocation.id}:${allocation.checkInCode}`;
  const events = db.checkEvents
    .filter((event) => event.allocationId === allocation.id)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <Panel
        title="Your gate pass"
        description="Show this at the hostel gate. Security scan it to record your arrival or departure."
      >
        <QrPass
          payload={payload}
          studentName={user.name}
          roomLine={`Room ${room.number} · ${bed?.label ?? ""}`}
          hostelName={hostel.name}
          statusLabel={STATUS_TEXT[state]}
        />
      </Panel>

      <Panel
        title="My gate log"
        description="Every scan recorded against your pass, newest first."
      >
        {events.length === 0 ? (
          <EmptyState
            title="No scans recorded yet"
            body="Your first scan at the gate will appear here."
          />
        ) : (
          <ul className="divide-y divide-cream-200">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {event.type === "in" ? "Arrival at the hostel" : "Departure from the hostel"}
                  </p>
                  <p className="text-xs text-ink-700/60">{formatDateTime(event.at)}</p>
                </div>
                <Badge tone={event.type === "in" ? "green" : "neutral"}>
                  {event.type === "in" ? "In" : "Out"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}