import { closeLostFound, reportLostFound } from "@/lib/actions";
import { Badge, EmptyState, Panel, labelCls, selectCls, textareaCls } from "@/components/ui";
import { readDb } from "@/lib/db";
import type { User } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const KIND_TONE = { lost: "red", found: "green" } as const;

async function LostFoundList({
  admin = false,
}: {
  admin?: boolean;
}) {
  const db = await readDb();
  const items = [...db.lostFound].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (items.length === 0) {
    return (
      <EmptyState
        title="The board is empty"
        body="Items reported lost or found around campus will appear here."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "rounded-2xl p-4 ring-1 ring-cream-300 sm:p-5",
            item.status === "closed" ? "bg-cream-100 opacity-75" : "bg-white",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={KIND_TONE[item.kind]}>{item.kind === "lost" ? "Lost" : "Found"}</Badge>
                <Badge tone={item.status === "open" ? "gold" : "neutral"}>{item.status}</Badge>
                <span className="text-xs text-ink-700/60">
                  {item.location} · {formatDate(item.createdAt)}
                </span>
              </div>
              <h3 className="mt-2 text-lg text-ink-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-800">{item.description}</p>
              <p className="mt-2 text-xs text-ink-700/60">
                Contact: <span className="font-medium text-ink-800">{item.contact}</span> · Posted
                by {item.reporterName}
              </p>
            </div>

            {admin ? (
              <form action={closeLostFound} className="shrink-0">
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  className="rounded-xl bg-cream-100 px-3.5 py-2.5 text-xs font-semibold text-ink-800 ring-1 ring-inset ring-cream-300 transition hover:bg-cream-200"
                >
                  {item.status === "open" ? "Mark resolved" : "Reopen"}
                </button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LostFoundSection({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <Panel
        title="Post an item"
        description="Report something you lost, or something you found, so it can be returned quickly."
      >
        <form action={reportLostFound} className="grid gap-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className={labelCls}>What are you posting?</legend>
            <div className="mt-2 flex gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 ring-1 ring-cream-300 transition has-[:checked]:bg-cream-100 has-[:checked]:ring-2 has-[:checked]:ring-forest-600">
                <input type="radio" name="kind" value="lost" defaultChecked className="accent-[#0f3d30]" />
                I lost something
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 ring-1 ring-cream-300 transition has-[:checked]:bg-cream-100 has-[:checked]:ring-2 has-[:checked]:ring-forest-600">
                <input type="radio" name="kind" value="found" className="accent-[#0f3d30]" />
                I found something
              </label>
            </div>
          </fieldset>

          <div>
            <label className={labelCls} htmlFor="title">
              Item
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. Casio scientific calculator"
              className={cn(selectCls, "mt-2")}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="lfLocation">
              Last seen / found at
            </label>
            <input
              id="lfLocation"
              name="location"
              placeholder="e.g. Outside the IT lab"
              className={cn(selectCls, "mt-2")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="lfDescription">
              Description
            </label>
            <textarea
              id="lfDescription"
              name="description"
              required
              minLength={10}
              placeholder="Colour, distinguishing marks, contents…"
              className={cn(textareaCls, "mt-2")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="lfContact">
              Contact
            </label>
            <input
              id="lfContact"
              name="contact"
              placeholder="Phone, email or 'porter's lodge'"
              className={cn(selectCls, "mt-2")}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-forest-700 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-600"
            >
              Post to the board
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title="Lost & found board"
        description={`Signed in as ${user.name} — your contact details appear only on items you post.`}
      >
        <LostFoundList />
      </Panel>
    </div>
  );
}

export async function LostFoundAdminSection() {
  const db = await readDb();
  const open = db.lostFound.filter((i) => i.status === "open").length;

  return (
    <div className="space-y-6">
      <Panel
        title={`Lost & found board (${open} open)`}
        description="Close an item once it has been returned to its owner."
      >
        <LostFoundList admin />
      </Panel>
    </div>
  );
}
