import Link from "next/link";
import { applyForBooking, reviewApplication } from "@/lib/actions";
import {
  Badge,
  EmptyState,
  OccupancyBar,
  Panel,
  btnDanger,
  btnPrimary,
  btnSecondary,
  labelCls,
  selectCls,
} from "@/components/ui";
import { readDb } from "@/lib/db";
import { activeAllocation, occupancyOf } from "@/lib/queries";
import type { User } from "@/lib/types";
import { cn, formatDate, money, semesterNow } from "@/lib/utils";

/* ------------------------------------------------------------ student view */

export async function BookingSection({ user }: { user: User }) {
  const db = await readDb();
  const semester = semesterNow();
  const allocation = activeAllocation(db, user.id, semester);
  const myApplications = db.applications
    .filter((a) => a.studentId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const appliedThisSemester = myApplications.find((a) => a.semester === semester);

  return (
    <div className="space-y-6">
      <Panel
        title="Apply for a bed"
        description={`Applications for ${semester} are reviewed by the hostel office. You will be assigned an exact room and bed once approved.`}
      >
        {allocation ? (
          <div className="rounded-2xl bg-moss-500/10 px-5 py-4 ring-1 ring-inset ring-moss-500/30">
            <p className="font-semibold text-forest-700">You already hold a bed this semester.</p>
            <p className="mt-1 text-sm text-forest-700/80">
              Open your room page to view the digital key card and QR check-in pass.
            </p>
            <Link href="/dashboard/room" className={cn(btnPrimary, "mt-4")}>
              Go to my room
            </Link>
          </div>
        ) : null}

        <div className={cn("grid gap-5 sm:grid-cols-2", allocation && "mt-5")}>
          {db.hostels.map((hostel) => {
            const { beds, occupied } = occupancyOf(db, hostel.id);
            const appliedTo = appliedThisSemester?.hostelId === hostel.id;
            const canApply = !allocation && !appliedThisSemester;
            return (
              <article
                key={hostel.id}
                className="flex flex-col rounded-2xl bg-cream-50 p-5 ring-1 ring-cream-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg text-ink-900">{hostel.name}</h3>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-gold-600">
                      {hostel.gender === "male"
                        ? "Male only"
                        : hostel.gender === "female"
                          ? "Female only"
                          : "Open admission"}
                      {" · "}
                      {hostel.campus}
                    </p>
                  </div>
                  <Badge tone={occupied / Math.max(beds, 1) >= 0.85 ? "red" : "green"}>
                    {beds - occupied} free
                  </Badge>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700/75">
                  {hostel.description}
                </p>
                <p className="mt-3 text-xs text-ink-700/60">
                  {money(hostel.monthlyFee)}/month · {hostel.location}
                </p>
                <div className="mt-3">
                  <OccupancyBar filled={occupied} total={beds} />
                </div>
                <form action={applyForBooking} className="mt-4">
                  <input type="hidden" name="hostelId" value={hostel.id} />
                  <button
                    type="submit"
                    disabled={!canApply}
                    className={cn(appliedTo ? btnSecondary : btnPrimary, "w-full")}
                  >
                    {appliedTo
                      ? "Application submitted ✓"
                      : allocation
                        ? "Bed already allocated"
                        : appliedThisSemester
                          ? "Application already sent"
                          : `Apply for ${hostel.name.split(" ")[0]}`}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="My applications" description="Every application you have submitted, newest first.">
        {myApplications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            body="Choose one of the hostels above to start your accommodation application."
          />
        ) : (
          <ul className="divide-y divide-cream-200">
            {myApplications.map((application) => {
              const hostel = db.hostels.find((h) => h.id === application.hostelId);
              return (
                <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div>
                    <p className="font-semibold text-ink-900">{hostel?.name ?? "Unknown hostel"}</p>
                    <p className="text-xs text-ink-700/65">
                      {application.semester} · submitted {formatDate(application.createdAt)}
                      {application.note ? ` · ${application.note}` : ""}
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
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------ admin view */

export async function ApplicationsSection() {
  const db = await readDb();
  const pending = db.applications
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const decided = db.applications
    .filter((a) => a.status !== "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const userById = (id: string) => db.users.find((u) => u.id === id);

  return (
    <div className="space-y-6">
      <Panel
        title={`Pending applications (${pending.length})`}
        description="Approve an applicant by assigning a free bed in the hostel they requested."
      >
        {pending.length === 0 ? (
          <EmptyState
            title="Inbox clear"
            body="No applications are waiting for review. New submissions appear here instantly."
          />
        ) : (
          <ul className="space-y-4">
            {pending.map((application) => {
              const student = userById(application.studentId);
              const hostel = db.hostels.find((h) => h.id === application.hostelId);
              const freeRooms = db.rooms.filter((r) =>
                r.beds.some((b) => !b.occupantId),
              ).length;
              const roomsForHostel = db.rooms.filter(
                (r) => r.hostelId === application.hostelId && r.beds.some((b) => !b.occupantId),
              );
              const alreadyAllocated = db.allocations.some(
                (a) => a.studentId === application.studentId && a.semester === application.semester,
              );

              return (
                <li
                  key={application.id}
                  className="rounded-2xl bg-cream-50 p-4 ring-1 ring-cream-300 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">
                        {student?.name ?? "Unknown student"}
                      </p>
                      <p className="text-xs text-ink-700/65">
                        {student?.regNumber ?? "—"} · {student?.program ?? "—"}
                      </p>
                      <p className="mt-1 text-sm text-ink-800">
                        Requested <strong>{hostel?.name}</strong> · {application.semester} ·
                        submitted {formatDate(application.createdAt)}
                      </p>
                    </div>
                    {alreadyAllocated ? <Badge tone="red">Already allocated</Badge> : null}
                  </div>

                  <form
                    action={reviewApplication}
                    className="mt-4 flex flex-wrap items-end gap-3"
                  >
                    <input type="hidden" name="applicationId" value={application.id} />
                    <div className="min-w-64 flex-1">
                      <label className={labelCls} htmlFor={`slot-${application.id}`}>
                        Bed to allocate
                      </label>
                      {roomsForHostel.length === 0 ? (
                        <p className="mt-2 text-sm text-clay-600">
                          No free beds in {hostel?.name} — reject or ask the student to apply
                          elsewhere ({freeRooms} free beds campus-wide).
                        </p>
                      ) : (
                        <select
                          id={`slot-${application.id}`}
                          name="slot"
                          required
                          defaultValue=""
                          className={cn(selectCls, "mt-2")}
                        >
                          <option value="" disabled>
                            Select room &amp; bed…
                          </option>
                          {roomsForHostel.map((room) => (
                            <optgroup key={room.id} label={`Room ${room.number}`}>
                              {room.beds
                                .filter((bed) => !bed.occupantId)
                                .map((bed) => (
                                  <option key={bed.id} value={`${room.id}|${bed.id}`}>
                                    {room.number} · {bed.label}
                                  </option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        name="decision"
                        value="approve"
                        disabled={roomsForHostel.length === 0}
                        className={btnPrimary}
                      >
                        Approve &amp; allocate
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="reject"
                        className={cn(btnDanger, "bg-white")}
                      >
                        Reject
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Recent decisions" description="Latest approved and rejected applications.">
        {decided.length === 0 ? (
          <EmptyState title="No decisions yet" body="Processed applications will be listed here." />
        ) : (
          <ul className="divide-y divide-cream-200">
            {decided.map((application) => {
              const student = userById(application.studentId);
              const hostel = db.hostels.find((h) => h.id === application.hostelId);
              const allocation = db.allocations.find(
                (a) => a.studentId === application.studentId && a.semester === application.semester,
              );
              const room = allocation ? db.rooms.find((r) => r.id === allocation.roomId) : null;
              const bed = room?.beds.find((b) => b.id === allocation?.bedId);
              return (
                <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div>
                    <p className="font-semibold text-ink-900">{student?.name ?? "Unknown"}</p>
                    <p className="text-xs text-ink-700/65">
                      {hostel?.name}
                      {room && bed ? ` · ${room.number} · ${bed.label}` : ""}
                      {application.note ? ` · ${application.note}` : ""}
                    </p>
                  </div>
                  <Badge tone={application.status === "approved" ? "green" : "red"}>
                    {application.status}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
