import { requestTransfer, reviewTransfer } from "@/lib/actions";
import { Badge, EmptyState, Panel, inputCls, labelCls, selectCls, textareaCls } from "@/components/ui";
import { readDb } from "@/lib/db";
import { activeAllocation, hostelById, occupancyOf, roomById, userName } from "@/lib/queries";
import type { User } from "@/lib/types";
import { cn, formatDate, semesterNow } from "@/lib/utils";

const STATUS_TONE = { pending: "gold", approved: "green", rejected: "red" } as const;

export async function TransfersSection({ user }: { user: User }) {
  const db = await readDb();
  const semester = semesterNow();
  const allocation = activeAllocation(db, user.id, semester);
  const currentHostel = allocation ? hostelById(db, allocation.hostelId) : undefined;
  const currentRoom = allocation ? roomById(db, allocation.roomId) : undefined;
  const myRequests = db.transfers
    .filter((t) => t.studentId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hasPending = myRequests.some((t) => t.status === "pending");

  const targetHostels = db.hostels.filter((hostel) => {
    if (hostel.id === allocation?.hostelId) return false;
    return occupancyOf(db, hostel.id).occupied < occupancyOf(db, hostel.id).beds;
  });

  return (
    <div className="space-y-6">
      {!allocation ? (
        <EmptyState
          title="Transfers need an allocated bed"
          body="Apply for accommodation first — once the hostel office allocates you a bed, you can request a regulated transfer from here."
        />
      ) : (
        <Panel
          title="Request a room transfer"
          description={`Your current placement is ${currentHostel?.name}, Room ${currentRoom?.number}. The hostel office reviews every request against live bed availability.`}
        >
          <form action={requestTransfer} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="toHostelId">
                Hostel you want to move to
              </label>
              <select
                id="toHostelId"
                name="toHostelId"
                required
                defaultValue=""
                disabled={hasPending}
                className={cn(selectCls, "mt-2")}
              >
                <option value="" disabled>
                  Select a hostel…
                </option>
                {targetHostels.map((hostel) => {
                  const { beds, occupied } = occupancyOf(db, hostel.id);
                  return (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.name} ({beds - occupied} free)
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="reason">
                Reason for transfer
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                minLength={10}
                disabled={hasPending}
                placeholder="e.g. My practical attachment pickup leaves from the other side of campus…"
                className={cn(textareaCls, "mt-2")}
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={hasPending}
                className="rounded-xl bg-forest-700 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasPending ? "Request already pending" : "Send transfer request"}
              </button>
              <p className="text-xs text-ink-700/60">
                Approved transfers re-issue your QR key card automatically.
              </p>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="My transfer requests" description="History of every request you have submitted.">
        {myRequests.length === 0 ? (
          <EmptyState title="No transfer requests" body="Requests you submit appear here with their decision." />
        ) : (
          <ul className="divide-y divide-cream-200">
            {myRequests.map((request) => {
              const hostel = hostelById(db, request.toHostelId);
              return (
                <li key={request.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">
                        Transfer to {hostel?.name ?? "Unknown hostel"}
                      </p>
                      <p className="text-xs text-ink-700/65">
                        Submitted {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-800">{request.reason}</p>
                  {request.reviewerNote ? (
                    <p className="mt-1 text-xs text-ink-700/65">Office note: {request.reviewerNote}</p>
                  ) : null}
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

export async function TransfersAdminSection() {
  const db = await readDb();
  const pending = db.transfers
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const decided = db.transfers
    .filter((t) => t.status !== "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const placement = (studentId: string) => {
    const allocation = db.allocations.find((a) => a.studentId === studentId);
    if (!allocation) return "No current bed";
    const room = roomById(db, allocation.roomId);
    const hostel = hostelById(db, allocation.hostelId);
    return `${hostel?.name ?? "—"} · ${room?.number ?? "—"}`;
  };

  return (
    <div className="space-y-6">
      <Panel
        title={`Pending transfer requests (${pending.length})`}
        description="Approving moves the student into the first free bed of the requested hostel and re-issues their key card."
      >
        {pending.length === 0 ? (
          <EmptyState title="Nothing to review" body="New transfer requests appear here instantly." />
        ) : (
          <ul className="space-y-4">
            {pending.map((request) => {
              const student = db.users.find((u) => u.id === request.studentId);
              const target = hostelById(db, request.toHostelId);
              const targetOccupancy = occupancyOf(db, request.toHostelId);
              const free = targetOccupancy.beds - targetOccupancy.occupied;
              return (
                <li
                  key={request.id}
                  className="rounded-2xl bg-cream-50 p-4 ring-1 ring-cream-300 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{student?.name ?? "Unknown"}</p>
                      <p className="text-xs text-ink-700/65">
                        {student?.regNumber ?? "—"} · currently {placement(request.studentId)} →{" "}
                        <strong>{target?.name}</strong> ({free} free beds)
                      </p>
                      <p className="mt-2 text-sm text-ink-800">{request.reason}</p>
                      <p className="mt-1 text-xs text-ink-700/55">
                        Submitted {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  <form
                    action={reviewTransfer}
                    className="mt-4 flex flex-wrap items-end gap-3"
                  >
                    <input type="hidden" name="transferId" value={request.id} />
                    <div className="min-w-56 flex-1">
                      <label className={labelCls} htmlFor={`note-${request.id}`}>
                        Note to student <span className="normal-case tracking-normal opacity-60">(optional)</span>
                      </label>
                      <input
                        id={`note-${request.id}`}
                        name="note"
                        placeholder="e.g. Move effective next Monday"
                        className={cn(inputCls, "mt-2")}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        name="decision"
                        value="approve"
                        disabled={free === 0}
                        className="rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-cream-50 transition hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve transfer
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="reject"
                        className="rounded-xl bg-clay-500/10 px-4 py-2.5 text-sm font-semibold text-clay-600 ring-1 ring-inset ring-clay-500/30 transition hover:bg-clay-500/15"
                      >
                        Reject
                      </button>
                    </div>
                  </form>
                  {free === 0 ? (
                    <p className="mt-2 text-xs text-clay-600">
                      No free beds in {target?.name} right now.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Decided requests" description="Approved and rejected transfers.">
        {decided.length === 0 ? (
          <EmptyState title="No decisions yet" body="Processed transfers will be archived here." />
        ) : (
          <ul className="divide-y divide-cream-200">
            {decided.map((request) => {
              const student = db.users.find((u) => u.id === request.studentId);
              const target = hostelById(db, request.toHostelId);
              return (
                <li key={request.id} className="py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">
                        {userName(db, request.studentId)} → {target?.name}
                      </p>
                      <p className="text-xs text-ink-700/65">
                        {student?.regNumber ?? "—"} · {formatDate(request.createdAt)}
                        {request.reviewerNote ? ` · ${request.reviewerNote}` : ""}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[request.status]}>{request.status}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
