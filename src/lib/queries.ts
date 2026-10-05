import type { Allocation, Db, Hostel, Room } from "./types";
import { semesterNow } from "./utils";

export function activeAllocation(
  db: Db,
  studentId: string,
  semester = semesterNow(),
): Allocation | undefined {
  return db.allocations.find((a) => a.studentId === studentId && a.semester === semester);
}

export function roomById(db: Db, roomId: string): Room | undefined {
  return db.rooms.find((r) => r.id === roomId);
}

export function hostelById(db: Db, hostelId: string): Hostel | undefined {
  return db.hostels.find((h) => h.id === hostelId);
}

export function occupancyOf(db: Db, hostelId: string): { beds: number; occupied: number } {
  const rooms = db.rooms.filter((r) => r.hostelId === hostelId);
  const beds = rooms.reduce((n, r) => n + r.beds.length, 0);
  const occupied = rooms.reduce(
    (n, r) => n + r.beds.filter((b) => b.occupantId !== null).length,
    0,
  );
  return { beds, occupied };
}

export function userName(db: Db, userId: string | null): string {
  if (!userId) return "Unknown";
  return db.users.find((u) => u.id === userId)?.name ?? "Unknown";
}

export type CheckInState = "not-checked-in" | "in-residence" | "checked-out";

export function checkInState(allocation: Allocation): CheckInState {
  if (!allocation.checkedInAt) return "not-checked-in";
  if (allocation.checkedOutAt && allocation.checkedOutAt > allocation.checkedInAt) {
    return "checked-out";
  }
  return "in-residence";
}
