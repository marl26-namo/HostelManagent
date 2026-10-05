import { recordInspection } from "@/lib/actions";
import { Badge, EmptyState, Panel, labelCls, selectCls, textareaCls } from "@/components/ui";
import { readDb } from "@/lib/db";
import { hostelById, roomById, userName } from "@/lib/queries";
import { cn, formatDateTime } from "@/lib/utils";

const CONDITIONS = [
  { value: "good", label: "Good", hint: "No issues recorded" },
  { value: "fair", label: "Fair", hint: "Minor wear, monitor" },
  { value: "poor", label: "Poor", hint: "Needs urgent attention" },
] as const;

const CONDITION_TONE = { good: "green", fair: "gold", poor: "red" } as const;

export async function InspectionsSection() {
  const db = await readDb();
  const inspections = [...db.inspections].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <Panel
        title="Record an inspection"
        description="Photographic evidence is attached to every inspection so room-condition disputes are settled with images."
      >
        <form action={recordInspection} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="roomId">
              Room inspected
            </label>
            <select id="roomId" name="roomId" required defaultValue="" className={cn(selectCls, "mt-2")}>
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

          <fieldset>
            <legend className={labelCls}>Condition</legend>
            <div className="mt-2 grid gap-2">
              {CONDITIONS.map((condition) => (
                <label
                  key={condition.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-2.5 text-sm ring-1 ring-cream-300 transition has-[:checked]:bg-cream-100 has-[:checked]:ring-2 has-[:checked]:ring-forest-600"
                >
                  <input
                    type="radio"
                    name="condition"
                    value={condition.value}
                    defaultChecked={condition.value === "good"}
                    className="accent-[#0f3d30]"
                  />
                  <span className="font-semibold text-ink-900">{condition.label}</span>
                  <span className="text-xs text-ink-700/60">{condition.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="notes">
              Inspector notes
            </label>
            <textarea
              id="notes"
              name="notes"
              placeholder="What did you observe — furniture, walls, fittings, cleanliness?"
              className={cn(textareaCls, "mt-2")}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="photos">
              Photo evidence <span className="normal-case tracking-normal opacity-60">(up to 4 images)</span>
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
              Save inspection
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title={`Inspection records (${inspections.length})`}
        description="Newest first — every record keeps its photo evidence."
      >
        {inspections.length === 0 ? (
          <EmptyState
            title="No inspections recorded"
            body="Complete the form above to build the photographic inspection archive."
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {inspections.map((inspection) => {
              const room = roomById(db, inspection.roomId);
              const hostel = room ? hostelById(db, room.hostelId) : undefined;
              return (
                <li key={inspection.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-cream-300">
                  {inspection.photos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={inspection.photos[0]}
                      alt={`Inspection of room ${room?.number ?? ""}`}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-24 w-full place-items-center bg-cream-100 text-xs text-ink-700/50">
                      No photo attached
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-ink-900">
                        {hostel?.name} · Room {room?.number}
                      </p>
                      <Badge tone={CONDITION_TONE[inspection.condition]}>
                        {inspection.condition}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-800">{inspection.notes}</p>
                    <p className="mt-2 text-xs text-ink-700/55">
                      {userName(db, inspection.inspectorId)} · {formatDateTime(inspection.createdAt)}
                    </p>
                    {inspection.photos.length > 1 ? (
                      <div className="mt-3 flex gap-2">
                        {inspection.photos.slice(1).map((photo, index) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={index}
                            src={photo}
                            alt={`Additional inspection photo ${index + 1}`}
                            className="h-14 w-20 rounded-lg object-cover ring-1 ring-cream-300"
                          />
                        ))}
                      </div>
                    ) : null}
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
