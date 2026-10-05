import Link from "next/link";
import { QrPass } from "@/components/qr";
import {
  Badge,
  Card,
  EmptyState,
  OccupancyBar,
  Panel,
  StatTile,
  btnPrimary,
} from "@/components/ui";
import { readDb } from "@/lib/db";
import { activeAllocation, checkInState, hostelById, roomById } from "@/lib/queries";
import type { User } from "@/lib/types";
import { cn, formatDateTime, money, semesterNow } from "@/lib/utils";

const STATUS_LABEL = {
  "not-checked-in": "Not checked in",
  "in-residence": "In residence",
  "checked-out": "Checked out",
} as const;

export function RoomSection({ user }: { user: User }) {
  const db = readDb();
  const semester = semesterNow();
  const allocation = activeAllocation(db, user.id, semester);

  if (!allocation) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No bed allocated yet"
          body="Submit an application from the Book a room page — once the hostel office approves it, your room details and QR key card appear here."
        />
        <div className="flex justify-center">
          <Link href="/dashboard/booking" className={btnPrimary}>
            Apply for a bed
          </Link>
        </div>
      </div>
    );
  }

  const room = roomById(db, allocation.roomId);
  const hostel = hostelById(db, allocation.hostelId);
  const bed = room?.beds.find((b) => b.id === allocation.bedId);
  const state = checkInState(allocation);
  const roommates = room
    ? room.beds
        .filter((b) => b.occupantId && b.occupantId !== user.id)
        .map((b) => ({
          bed: b.label,
          occupant: db.users.find((u) => u.id === b.occupantId),
        }))
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <QrPass
        payload={`MUBAS-CI:${allocation.id}:${allocation.checkInCode}`}
        studentName={user.name}
        roomLine={`Room ${room?.number ?? "—"} · ${bed?.label ?? "—"}`}
        hostelName={hostel?.name ?? "Hostel"}
        statusLabel={STATUS_LABEL[state]}
      />

      <div className="space-y-6">
        <Panel title="Allocation details" description={`Active for ${semester}.`}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Hostel", hostel?.name ?? "—"],
              ["Location", hostel?.location ?? "—"],
              ["Room", room?.number ?? "—"],
              ["Bed", bed?.label ?? "—"],
              ["Monthly fee", money(hostel?.monthlyFee ?? 27000)],
              ["Semester", allocation.semester],
              ["Checked in", allocation.checkedInAt ? formatDateTime(allocation.checkedInAt) : "—"],
              ["Checked out", allocation.checkedOutAt ? formatDateTime(allocation.checkedOutAt) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-cream-50 px-3.5 py-2.5 ring-1 ring-cream-200">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-700/55">
                  {label}
                </dt>
                <dd className="mt-1 font-medium text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge
              tone={
                state === "in-residence" ? "green" : state === "checked-out" ? "neutral" : "gold"
              }
            >
              {STATUS_LABEL[state]}
            </Badge>
            <Link href="/dashboard/transfers" className={btnPrimary}>
              Request a transfer
            </Link>
          </div>
        </Panel>

        <Panel
          title="Roommates"
          description="Students sharing this room for the current semester."
        >
          {roommates.length === 0 ? (
            <p className="text-sm text-ink-700/70">
              No other students are allocated to this room yet.
            </p>
          ) : (
            <ul className="divide-y divide-cream-200">
              {roommates.map(({ bed: bedLabel, occupant }) => (
                <li key={bedLabel} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-700 text-xs font-bold text-cream-50">
                      {(occupant?.name ?? "?")
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{occupant?.name ?? "Unknown"}</p>
                      <p className="text-xs text-ink-700/60">
                        {occupant?.regNumber ?? "—"} · {occupant?.program ?? "—"}
                      </p>
                    </div>
                  </div>
                  <Badge>{bedLabel}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ admin view */

export function RoomsSection() {
  const db = readDb();
  const totalBeds = db.rooms.reduce((n, r) => n + r.beds.length, 0);
  const occupied = db.rooms.reduce(
    (n, r) => n + r.beds.filter((b) => b.occupantId !== null).length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Residences" value={String(db.hostels.length)} hint="6 on-campus · 2 off-campus" />
        <StatTile label="Beds occupied" value={`${occupied}`} hint={`of ${totalBeds} total beds`} />
        <StatTile label="Beds free" value={String(totalBeds - occupied)} hint="available for allocation" />
        <StatTile
          label="Occupancy"
          value={`${Math.round((occupied / Math.max(totalBeds, 1)) * 100)}%`}
          hint="campus-wide, live"
          tone="dark"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {db.hostels.map((hostel) => {
          const rooms = db.rooms.filter((r) => r.hostelId === hostel.id);
          const beds = rooms.reduce((n, r) => n + r.beds.length, 0);
          const filled = rooms.reduce(
            (n, r) => n + r.beds.filter((b) => b.occupantId !== null).length,
            0,
          );
          return (
            <Card key={hostel.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg text-ink-900">{hostel.name}</h3>
                  <p className="text-xs uppercase tracking-[0.14em] text-gold-600">
                    {hostel.gender === "male"
                      ? "Male only"
                      : hostel.gender === "female"
                        ? "Female only"
                        : "Open admission"}
                    {" · "}
                    {hostel.campus}
                  </p>
                </div>
                <Badge tone={filled === beds ? "red" : "green"}>
                  {filled}/{beds} beds
                </Badge>
              </div>

              <div className="mt-3">
                <OccupancyBar filled={filled} total={beds} />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
                {rooms.map((room) => {
                  const taken = room.beds.filter((b) => b.occupantId !== null).length;
                  const full = taken === room.beds.length;
                  return (
                    <div
                      key={room.id}
                      title={`Room ${room.number}: ${taken}/${room.beds.length} beds`}
                      className={cn(
                        "rounded-lg px-2 py-1.5 text-center text-[11px] font-semibold ring-1 ring-inset",
                        full
                          ? "bg-clay-500/10 text-clay-600 ring-clay-500/30"
                          : taken > 0
                            ? "bg-gold-500/15 text-gold-600 ring-gold-500/35"
                            : "bg-moss-500/10 text-forest-700 ring-moss-500/30",
                      )}
                    >
                      <span className="block">{room.number}</span>
                      <span className="block text-[10px] font-medium opacity-70">
                        {taken}/{room.beds.length}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
