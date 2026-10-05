import { setTicketStatus, submitTicket, voteTicket } from "@/lib/actions";
import {
  Badge,
  EmptyState,
  Panel,
  StatTile,
  inputCls,
  labelCls,
  selectCls,
  textareaCls,
} from "@/components/ui";
import { readDb } from "@/lib/db";
import { activeAllocation, hostelById, roomById, userName } from "@/lib/queries";
import type { User } from "@/lib/types";
import { cn, formatDate, semesterNow } from "@/lib/utils";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Furniture",
  "Carpentry",
  "Cleaning",
  "Wi-Fi / network",
  "Pests",
  "Other",
];

const STATUS_TONE = {
  open: "gold",
  "in-progress": "neutral",
  resolved: "green",
} as const;

function RoomPhotoGrid({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={photo}
          alt={`Report photo ${index + 1}`}
          className="aspect-[4/3] w-full rounded-lg object-cover ring-1 ring-cream-300"
        />
      ))}
    </div>
  );
}

export async function MaintenanceSection({ user }: { user: User }) {
  const db = await readDb();
  const allocation = activeAllocation(db, user.id, semesterNow());
  const defaultRoomId = allocation?.roomId ?? "";
  const tickets = [...db.tickets].sort(
    (a, b) => b.votes.length - a.votes.length || b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="space-y-6">
      <Panel
        title="Report a problem"
        description="Describe the issue, attach a photo, and other residents can second it so the works team sees real demand."
      >
        <form action={submitTicket} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="roomId">
              Room affected
            </label>
            <select
              id="roomId"
              name="roomId"
              required
              defaultValue={defaultRoomId}
              className={cn(selectCls, "mt-2")}
            >
              <option value="" disabled>
                Select a room…
              </option>
              {db.hostels.map((hostel) => (
                <optgroup key={hostel.id} label={hostel.name}>
                  {db.rooms
                    .filter((r) => r.hostelId === hostel.id)
                    .map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.number}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="category">
              Category
            </label>
            <select id="category" name="category" className={cn(selectCls, "mt-2")} defaultValue="Plumbing">
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="description">
              What is wrong?
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              placeholder="e.g. The shower tap drips constantly and the drain is backing up."
              className={cn(textareaCls, "mt-2")}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="photos">
              Photos <span className="normal-case tracking-normal opacity-60">(optional, up to 4)</span>
            </label>
            <input
              id="photos"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              className="mt-2 block w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-700 ring-1 ring-inset ring-cream-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cream-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink-800"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-forest-700 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-600"
            >
              Submit report
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Resident reports"
        description="Sorted by community support — second the reports that affect you too."
        aside={
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700/55">
            {tickets.filter((t) => t.status !== "resolved").length} active
          </span>
        }
      >
        {tickets.length === 0 ? (
          <EmptyState
            title="No maintenance reports"
            body="Everything is in working order — be the first to report a problem if you spot one."
          />
        ) : (
          <ul className="space-y-4">
            {tickets.map((ticket) => {
              const room = roomById(db, ticket.roomId);
              const hostel = hostelById(db, room?.hostelId ?? "");
              const seconded = ticket.votes.includes(user.id);
              return (
                <li
                  key={ticket.id}
                  className="rounded-2xl bg-cream-50 p-4 ring-1 ring-cream-300 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="dark">{ticket.category}</Badge>
                        <Badge tone={STATUS_TONE[ticket.status]}>{ticket.status}</Badge>
                        <span className="text-xs text-ink-700/60">
                          {hostel?.name} · Room {room?.number} · {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-800">
                        {ticket.description}
                      </p>
                      <p className="mt-1 text-xs text-ink-700/55">
                        Reported by {userName(db, ticket.studentId)}
                      </p>
                    </div>

                    <form action={voteTicket} className="shrink-0">
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <button
                        type="submit"
                        disabled={seconded || ticket.status === "resolved"}
                        className={cn(
                          "flex flex-col items-center rounded-xl px-3.5 py-2 transition",
                          seconded
                            ? "bg-forest-700 text-cream-50"
                            : "bg-white text-ink-800 ring-1 ring-inset ring-cream-300 hover:ring-forest-600",
                          (seconded || ticket.status === "resolved") && "cursor-not-allowed opacity-70",
                        )}
                        title={seconded ? "You have seconded this report" : "Second this report"}
                      >
                        <span className="text-lg leading-none">▲</span>
                        <span className="mt-1 text-xs font-bold">{ticket.votes.length}</span>
                        <span className="text-[9px] uppercase tracking-wider opacity-75">
                          {seconded ? "yours" : "second"}
                        </span>
                      </button>
                    </form>
                  </div>
                  <RoomPhotoGrid photos={ticket.photos} />
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

export async function MaintenanceAdminSection() {
  const db = await readDb();
  const tickets = [...db.tickets].sort(
    (a, b) =>
      (a.status === "resolved" ? 1 : 0) - (b.status === "resolved" ? 1 : 0) ||
      b.votes.length - a.votes.length ||
      b.createdAt.localeCompare(a.createdAt),
  );
  const count = (status: string) => db.tickets.filter((t) => t.status === status).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Open" value={String(count("open"))} hint="awaiting triage" tone="gold" />
        <StatTile label="In progress" value={String(count("in-progress"))} hint="works team engaged" />
        <StatTile label="Resolved" value={String(count("resolved"))} hint="closed reports" tone="dark" />
      </div>

      <Panel
        title="Maintenance queue"
        description="Prioritised by resident votes — the reports with the most support sit at the top."
      >
        {tickets.length === 0 ? (
          <EmptyState title="Queue empty" body="No maintenance reports have been submitted." />
        ) : (
          <ul className="space-y-4">
            {tickets.map((ticket) => {
              const room = roomById(db, ticket.roomId);
              const hostel = hostelById(db, room?.hostelId ?? "");
              return (
                <li
                  key={ticket.id}
                  className="rounded-2xl bg-cream-50 p-4 ring-1 ring-cream-300 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="dark">{ticket.category}</Badge>
                        <Badge tone={STATUS_TONE[ticket.status]}>{ticket.status}</Badge>
                        <Badge tone="green">▲ {ticket.votes.length} residents</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-800">
                        {ticket.description}
                      </p>
                      <p className="mt-1 text-xs text-ink-700/60">
                        {hostel?.name} · Room {room?.number} · {userName(db, ticket.studentId)} ·{" "}
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>

                    <form
                      action={setTicketStatus}
                      className="flex shrink-0 items-center gap-2"
                    >
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <select
                        name="status"
                        defaultValue={ticket.status}
                        aria-label="Ticket status"
                        className={cn(selectCls, "w-40")}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-xl bg-forest-700 px-3.5 py-2.5 text-xs font-bold text-cream-50 transition hover:bg-forest-600"
                      >
                        Update
                      </button>
                    </form>
                  </div>
                  <RoomPhotoGrid photos={ticket.photos} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
