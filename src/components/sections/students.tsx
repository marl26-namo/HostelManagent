import { createStudentAccount } from "@/lib/actions";
import { Badge, EmptyState, Panel, inputCls, labelCls, selectCls } from "@/components/ui";
import { readDb } from "@/lib/db";
import { activeAllocation, hostelById, roomById } from "@/lib/queries";
import { cn, formatDate, semesterNow } from "@/lib/utils";

const PROGRAMS = [
  "BSc Information Systems",
  "BSc Computer Science",
  "BEng Information Technology",
  "BBA Business Administration",
  "BSC Procurement & Supply Management",
];

/**
 * Admin portal section: the hostel office issues student portal accounts here and
 * hands the credentials to each student. Students cannot register themselves.
 */
export async function StudentsAdminSection() {
  const db = await readDb();
  const semester = semesterNow();
  const students = db.users
    .filter((user) => user.role === "student")
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <Panel
        title="Issue a student account"
        description="Create the portal login for a student, then hand over the email and password. The student signs in with these credentials on any device."
      >
        <form action={createStudentAccount} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Chikondi Thipa"
              className={cn(inputCls, "mt-2")}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="regNumber">
              Registration number
            </label>
            <input
              id="regNumber"
              name="regNumber"
              placeholder="e.g. BCS/25/EP/104"
              className={cn(inputCls, "mt-2")}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="accountEmail">
              Email address
            </label>
            <input
              id="accountEmail"
              name="email"
              type="email"
              required
              placeholder="student@mubas.ac.mw"
              className={cn(inputCls, "mt-2")}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="program">
              Programme
            </label>
            <select id="program" name="program" className={cn(selectCls, "mt-2")} defaultValue={PROGRAMS[0]}>
              {PROGRAMS.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="year">
              Year of study
            </label>
            <select id="year" name="year" className={cn(selectCls, "mt-2")} defaultValue="1">
              {[1, 2, 3, 4, 5, 6].map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              placeholder="e.g. 0991234567"
              className={cn(inputCls, "mt-2")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="password">
              Temporary password{" "}
              <span className="normal-case tracking-normal opacity-60">
                (min. 6 characters — share it with the student)
              </span>
            </label>
            <input
              id="password"
              name="password"
              type="text"
              required
              minLength={6}
              placeholder="e.g. mubas-2026"
              className={cn(inputCls, "mt-2")}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-forest-700 px-5 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-600"
            >
              Create student account
            </button>
          </div>
        </form>
      </Panel>

      <Panel
        title={`Issued student accounts (${students.length})`}
        description="Every login currently issued to a student, with the bed it holds this semester."
      >
        {students.length === 0 ? (
          <EmptyState
            title="No student accounts yet"
            body="Use the form above to issue the first student portal login."
          />
        ) : (
          <ul className="divide-y divide-cream-200">
            {students.map((student) => {
              const allocation = activeAllocation(db, student.id, semester);
              const room = allocation ? roomById(db, allocation.roomId) : undefined;
              const hostel = allocation ? hostelById(db, allocation.hostelId) : undefined;
              return (
                <li
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{student.name}</p>
                    <p className="text-xs text-ink-700/65">
                      {student.email}
                      {student.regNumber ? ` · ${student.regNumber}` : ""}
                      {student.program ? ` · ${student.program}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-700/50">
                      Issued {formatDate(student.createdAt)}
                    </p>
                  </div>
                  <Badge tone={allocation ? "green" : "gold"}>
                    {allocation && room
                      ? `${hostel?.name} · ${room.number}`
                      : "No bed allocated"}
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