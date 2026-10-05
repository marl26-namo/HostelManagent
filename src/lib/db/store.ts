import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "./client";
import type {
  Allocation,
  Application,
  Bed,
  Db,
  Hostel,
  Inspection,
  LostFoundItem,
  MaintenanceTicket,
  NoiseComplaint,
  Payment,
  Receipt,
  Room,
  TransferRequest,
  User,
} from "../types";

/**
 * Reads the residence data out of Postgres and reshapes it into the view model the
 * pages and sections already consume. Rows are fetched in parallel and stitched
 * together in memory, which keeps every screen rendering from one consistent
 * point-in-time snapshot.
 */
export async function loadSnapshot(): Promise<Db> {
  const db = getDb();

  const [
    userRows,
    hostelRows,
    roomRows,
    bedRows,
    applicationRows,
    allocationRows,
    paymentRows,
    receiptRows,
    ticketRows,
    voteRows,
    transferRows,
    complaintRows,
    lostFoundRows,
    inspectionRows,
    checkEventRows,
    counterRows,
  ] = await Promise.all([
    db.select().from(schema.users),
    db.select().from(schema.hostels),
    db.select().from(schema.rooms),
    db.select().from(schema.beds),
    db.select().from(schema.applications),
    db.select().from(schema.allocations),
    db.select().from(schema.payments),
    db.select().from(schema.receipts),
    db.select().from(schema.maintenanceTickets),
    db.select().from(schema.ticketVotes),
    db.select().from(schema.transferRequests),
    db.select().from(schema.noiseComplaints),
    db.select().from(schema.lostFoundItems),
    db.select().from(schema.inspections),
    db.select().from(schema.checkEvents),
    db.select().from(schema.counters),
  ]);

  const users: User[] = userRows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    regNumber: row.regNumber ?? undefined,
    program: row.program ?? undefined,
    year: row.year ?? undefined,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt,
  }));

  const hostels: Hostel[] = hostelRows.map((row) => ({
    id: row.id,
    name: row.name,
    gender: row.gender,
    campus: row.campus,
    location: row.location,
    description: row.description,
    monthlyFee: row.monthlyFee,
    amenities: row.amenities,
    photoUrl: row.photoUrl ?? undefined,
    rating: row.rating ?? undefined,
  }));

  const bedsByRoom = new Map<string, Bed[]>();
  for (const row of bedRows) {
    const list = bedsByRoom.get(row.roomId) ?? [];
    list.push({ id: row.id, label: row.label, occupantId: row.occupantId });
    bedsByRoom.set(row.roomId, list);
  }

  const rooms: Room[] = roomRows.map((row) => ({
    id: row.id,
    hostelId: row.hostelId,
    number: row.number,
    floor: row.floor ?? undefined,
    beds: (bedsByRoom.get(row.id) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
  }));

  const applications: Application[] = applicationRows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    hostelId: row.hostelId,
    semester: row.semester,
    status: row.status,
    note: row.note ?? undefined,
    decidedAt: row.decidedAt ?? undefined,
    createdAt: row.createdAt,
  }));

  const allocations: Allocation[] = allocationRows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    hostelId: row.hostelId,
    roomId: row.roomId,
    bedId: row.bedId,
    semester: row.semester,
    status: row.status,
    checkInCode: row.checkInCode,
    checkedInAt: row.checkedInAt,
    checkedOutAt: row.checkedOutAt,
    createdAt: row.createdAt,
  }));

  const payments: Payment[] = paymentRows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    amount: row.amount,
    method: row.method,
    payerPhone: row.payerPhone,
    reference: row.reference,
    semester: row.semester,
    status: row.status,
    createdAt: row.createdAt,
  }));

  const receipts: Receipt[] = receiptRows.map((row) => ({
    id: row.id,
    paymentId: row.paymentId,
    tracking: row.tracking,
    issuedAt: row.issuedAt,
  }));

  const votesByTicket = new Map<string, string[]>();
  for (const row of voteRows) {
    const list = votesByTicket.get(row.ticketId) ?? [];
    list.push(row.studentId);
    votesByTicket.set(row.ticketId, list);
  }

  const tickets: MaintenanceTicket[] = ticketRows.map((row) => ({
    id: row.id,
    roomId: row.roomId,
    studentId: row.studentId,
    category: row.category,
    description: row.description,
    photos: row.photos,
    votes: votesByTicket.get(row.id) ?? [],
    status: row.status,
    createdAt: row.createdAt,
  }));

  const transfers: TransferRequest[] = transferRows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    fromAllocationId: row.fromAllocationId,
    toHostelId: row.toHostelId,
    reason: row.reason,
    status: row.status,
    reviewerNote: row.reviewerNote ?? undefined,
    createdAt: row.createdAt,
  }));

  const complaints: NoiseComplaint[] = complaintRows.map((row) => ({
    id: row.id,
    hostelId: row.hostelId,
    location: row.location,
    description: row.description,
    status: row.status,
    resolvedAt: row.resolvedAt ?? undefined,
    createdAt: row.createdAt,
  }));

  const lostFound: LostFoundItem[] = lostFoundRows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    location: row.location,
    contact: row.contact,
    reporterName: row.reporterName,
    status: row.status as LostFoundItem["status"],
    createdAt: row.createdAt,
  }));

  const inspections: Inspection[] = inspectionRows.map((row) => ({
    id: row.id,
    roomId: row.roomId,
    inspectorId: row.inspectorId,
    condition: row.condition,
    notes: row.notes,
    photos: row.photos,
    createdAt: row.createdAt,
  }));

  return {
    users,
    hostels,
    rooms,
    applications,
    allocations,
    payments,
    receipts,
    tickets,
    transfers,
    complaints,
    lostFound,
    inspections,
    checkEvents: checkEventRows.map((row) => ({
      id: row.id,
      allocationId: row.allocationId,
      type: row.type,
      at: row.at,
      code: row.code,
      byId: row.byId,
    })),
    counters: {
      receiptSeq: counterRows.find((row) => row.name === "receipt")?.value ?? 0,
    },
  };
}

/** Look up a single user for session handling, without hydrating the whole database. */
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email.toLowerCase()}`)
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    regNumber: row.regNumber ?? undefined,
    program: row.program ?? undefined,
    year: row.year ?? undefined,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt,
  };
}

export async function findUserById(id: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    regNumber: row.regNumber ?? undefined,
    program: row.program ?? undefined,
    year: row.year ?? undefined,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt,
  };
}