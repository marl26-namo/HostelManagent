import { CheckInConsole } from "@/components/qr";
import { Badge, EmptyState, Panel, StatTile } from "@/components/ui";
import { readDb } from "@/lib/db";
import { checkInState, hostelById, roomById, userName } from "@/lib/queries";
import { formatDateTime, timeOnly } from "@/lib/utils";

export async function CheckinsSection() {
  const db = await readDb();

  const placements = db.allocations
    .map((allocation) => {
      const room = roomById(db, allocation.roomId);
      const hostel = hostelById(db, allocation.hostelId);
      const bed = room?.beds.find((b) => b.id === allocation.bedId);
      return {
        allocation,
        room,
        hostel,
        bed,
        state: checkInState(allocation),
        student: db.users.find((u) => u.id === allocation.studentId),
      };
    })
    .filter((p) => p.room && p.hostel && p.student);

  const inResidence = placements.filter((p) => p.state === "in-residence");
  const checkedOut = placements.filter((p) => p.state === "checked-out");
  const awaiting = placements.filter((p) => p.state === "not-checked-in");
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = db.checkEvents.filter((e) => e.at.slice(0, 10) === today);

  const events = [...db.checkEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="In residence" value={String(inResidence.length)} hint="currently checked in" tone="dark" />
        <StatTile label="Checked out" value={String(checkedOut.length)} hint="away from hostel" />
        <StatTile label="Not checked in" value={String(awaiting.length)} hint="allocated, yet to arrive" />
        <StatTile label="Gate movements today" value={String(todayEvents.length)} hint="scans recorded today" tone="gold" />
      </div>

      <CheckInConsole />

      <Panel title="Gate log" description="The last 15 check-in and check-out scans.">
        {events.length === 0 ? (
          <EmptyState
            title="No scans yet"
            body="Scan a student QR key card above and the movement will be recorded here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-300 text-[10px] uppercase tracking-[0.16em] text-ink-700/60">
                  <th className="py-2 pr-4 font-bold">When</th>
                  <th className="py-2 pr-4 font-bold">Student</th>
                  <th className="py-2 pr-4 font-bold">Movement</th>
                  <th className="py-2 pr-4 font-bold">Placement</th>
                  <th className="py-2 font-bold">Scanned by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {events.map((event) => {
                  const allocation = db.allocations.find((a) => a.id === event.allocationId);
                  const student = allocation
                    ? db.users.find((u) => u.id === allocation.studentId)
                    : undefined;
                  const room = allocation ? roomById(db, allocation.roomId) : undefined;
                  const hostel = allocation ? hostelById(db, allocation.hostelId) : undefined;
                  return (
                    <tr key={event.id}>
                      <td className="py-3 pr-4 text-xs text-ink-700/70">
                        {formatDateTime(event.at)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-ink-900">
                        {student?.name ?? "Unknown"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={event.type === "in" ? "green" : "neutral"}>
                          {event.type === "in" ? "Arrival" : "Departure"}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {hostel?.name} · {room?.number}
                      </td>
                      <td className="py-3 text-xs">{userName(db, event.byId)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Residency status"
        description="Every active allocation and where its holder currently is."
      >
        {placements.length === 0 ? (
          <EmptyState title="No allocations" body="Approved applications appear here with live check-in status." />
        ) : (
          <ul className="divide-y divide-cream-200">
            {placements.map(({ allocation, room, hostel, bed, state, student }) => (
              <li key={allocation.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="font-semibold text-ink-900">{student?.name}</p>
                  <p className="text-xs text-ink-700/60">
                    {hostel?.name} · Room {room?.number} · {bed?.label} ·{" "}
                    {allocation.checkedInAt ? `checked in ${timeOnly(allocation.checkedInAt)}` : "no arrival recorded"}
                  </p>
                </div>
                <Badge
                  tone={state === "in-residence" ? "green" : state === "checked-out" ? "neutral" : "gold"}
                >
                  {state === "in-residence"
                    ? "In residence"
                    : state === "checked-out"
                      ? "Checked out"
                      : "Not checked in"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
