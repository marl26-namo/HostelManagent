import { setComplaintStatus, submitComplaint } from "@/lib/actions";
import { Badge, EmptyState, Panel, labelCls, selectCls, textareaCls } from "@/components/ui";
import { readDb } from "@/lib/db";
import { hostelById } from "@/lib/queries";
import { cn, formatDate } from "@/lib/utils";

const STATUS_TONE = { new: "gold", acknowledged: "neutral", resolved: "green" } as const;

export function ComplaintsSection() {
  const db = readDb();
  const complaints = [...db.complaints].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-ink-900 px-5 py-4 text-cream-100 ring-1 ring-ink-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">
          Anonymous by design
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-cream-100/75">
          Noise complaints are recorded with the hostel, location and description only. Your
          name, registration number and account are <strong>never stored</strong> with the
          complaint — not even for administrators.
        </p>
      </div>

      <Panel
        title="Report noise"
        description="Lodging a report does not reveal your identity to anyone, including the hostel office."
      >
        <form action={submitComplaint} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="hostelId">
              Hostel
            </label>
            <select id="hostelId" name="hostelId" required defaultValue="" className={cn(selectCls, "mt-2")}>
              <option value="" disabled>
                Select a hostel…
              </option>
              {db.hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="location">
              Specific location
            </label>
            <input
              id="location"
              name="location"
              placeholder="e.g. Block C courtyard, Room NY-08 corridor"
              className={cn(selectCls, "mt-2")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="description">
              What happened?
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              placeholder="e.g. Loud music from the courtyard continuing past 02:00 on week nights."
              className={cn(textareaCls, "mt-2")}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-forest-700 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-600"
            >
              Submit anonymously
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Recent complaints"
        description="All logged noise complaints across the residences — reported without attribution."
      >
        {complaints.length === 0 ? (
          <EmptyState
            title="No complaints logged"
            body="Quiet campus! Complaints submitted by residents will be listed here anonymously."
          />
        ) : (
          <ul className="space-y-3">
            {complaints.map((complaint) => {
              const hostel = hostelById(db, complaint.hostelId);
              return (
                <li
                  key={complaint.id}
                  className="rounded-2xl bg-cream-50 px-4 py-3.5 ring-1 ring-cream-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink-900">
                      {hostel?.name ?? "Unknown hostel"} · {complaint.location}
                    </p>
                    <Badge tone={STATUS_TONE[complaint.status]}>{complaint.status}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-800">{complaint.description}</p>
                  <p className="mt-1 text-xs text-ink-700/55">{formatDate(complaint.createdAt)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export function ComplaintsAdminSection() {
  const db = readDb();
  const complaints = [...db.complaints].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (status: string) => db.complaints.filter((c) => c.status === status).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Badge tone="gold">New: {count("new")}</Badge>
        <Badge tone="neutral">Acknowledged: {count("acknowledged")}</Badge>
        <Badge tone="green">Resolved: {count("resolved")}</Badge>
      </div>

      <Panel
        title="Noise complaints"
        description="Submitted anonymously — no reporter identity is stored with any complaint."
      >
        {complaints.length === 0 ? (
          <EmptyState title="No complaints" body="Anonymous complaints from residents appear here." />
        ) : (
          <ul className="space-y-4">
            {complaints.map((complaint) => {
              const hostel = hostelById(db, complaint.hostelId);
              return (
                <li
                  key={complaint.id}
                  className="rounded-2xl bg-cream-50 p-4 ring-1 ring-cream-300 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="dark">{hostel?.name ?? "Unknown"}</Badge>
                        <Badge tone={STATUS_TONE[complaint.status]}>{complaint.status}</Badge>
                        <span className="text-xs text-ink-700/60">
                          {complaint.location} · {formatDate(complaint.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-800">
                        {complaint.description}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink-700/50">
                        Reporter: anonymous
                      </p>
                    </div>

                    <form action={setComplaintStatus} className="flex shrink-0 items-center gap-2">
                      <input type="hidden" name="complaintId" value={complaint.id} />
                      <select
                        name="status"
                        defaultValue={complaint.status}
                        aria-label="Complaint status"
                        className={cn(selectCls, "w-40")}
                      >
                        <option value="new">New</option>
                        <option value="acknowledged">Acknowledged</option>
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
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
