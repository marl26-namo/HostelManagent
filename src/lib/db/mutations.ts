import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured, schema } from "./client";
import { updateJsonStore } from "../db";
import type {
  Allocation,
  Application,
  Inspection,
  LostFoundItem,
  MaintenanceTicket,
  NoiseComplaint,
  Payment,
  Receipt,
  TicketStatus,
  TransferRequest,
  User,
} from "../types";

/**
 * Every write in the application lives here.
 *
 * With `DATABASE_URL` configured each function issues Drizzle statements (multi-row
 * writes run inside a transaction so a bed can never be double-allocated). Without
 * it they fall back to the local JSON development store, keeping one copy of the
 * business rules instead of two divergent data layers.
 */

const now = () => new Date().toISOString();

/* ------------------------------------------------------------------ users */

export async function createUser(user: User): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.users.push(user);
    });
    return;
  }
  await getDb().insert(schema.users).values({
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    regNumber: user.regNumber ?? null,
    program: user.program ?? null,
    year: user.year ?? null,
    phone: user.phone ?? null,
    createdAt: user.createdAt,
  });
}

/* ----------------------------------------------------------- applications */

export async function createApplication(application: Application): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.applications.push(application);
    });
    return;
  }
  await getDb().insert(schema.applications).values({
    id: application.id,
    studentId: application.studentId,
    hostelId: application.hostelId,
    semester: application.semester,
    status: application.status,
    note: application.note ?? null,
    createdAt: application.createdAt,
  });
}

export async function setApplicationStatus(
  applicationId: string,
  status: Application["status"],
  note?: string,
): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      const application = db.applications.find((a) => a.id === applicationId);
      if (!application) return;
      application.status = status;
      application.note = note ?? application.note;
      application.decidedAt = now();
    });
    return;
  }
  await getDb()
    .update(schema.applications)
    .set({ status, note: note ?? null, decidedAt: now() })
    .where(eq(schema.applications.id, applicationId));
}

/**
 * Approve an application and allocate the chosen bed. The bed is claimed with a
 * conditional update, so two officers approving at the same time cannot hand the
 * same bed to two students.
 */
export async function approveApplication(input: {
  applicationId: string;
  studentId: string;
  roomId: string;
  bedId: string;
  semester: string;
  allocationId: string;
  checkInCode: string;
}): Promise<{ ok: boolean; reason?: "bed-taken" }> {
  if (!isDatabaseConfigured()) {
    let ok = true;
    await updateJsonStore((db) => {
      const room = db.rooms.find((r) => r.id === input.roomId);
      const bed = room?.beds.find((b) => b.id === input.bedId);
      if (!bed || bed.occupantId) {
        ok = false;
        return;
      }
      const application = db.applications.find((a) => a.id === input.applicationId);
      bed.occupantId = input.studentId;
      db.allocations.push({
        id: input.allocationId,
        studentId: input.studentId,
        hostelId: room!.hostelId,
        roomId: input.roomId,
        bedId: input.bedId,
        semester: input.semester,
        status: "active",
        checkInCode: input.checkInCode,
        checkedInAt: null,
        checkedOutAt: null,
        createdAt: now(),
      });
      if (application) {
        application.status = "approved";
        application.decidedAt = now();
      }
    });
    return { ok };
  }

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [room] = await tx
        .select({ id: schema.rooms.id, hostelId: schema.rooms.hostelId })
        .from(schema.rooms)
        .where(eq(schema.rooms.id, input.roomId))
        .limit(1);
      if (!room) throw new Error("room-not-found");

      const claimed = await tx
        .update(schema.beds)
        .set({ occupantId: input.studentId })
        .where(and(eq(schema.beds.id, input.bedId), isNull(schema.beds.occupantId)))
        .returning({ id: schema.beds.id });
      if (claimed.length === 0) throw new Error("bed-taken");

      await tx.insert(schema.allocations).values({
        id: input.allocationId,
        studentId: input.studentId,
        hostelId: room.hostelId,
        roomId: input.roomId,
        bedId: input.bedId,
        semester: input.semester,
        status: "active",
        checkInCode: input.checkInCode,
        createdAt: now(),
      });

      await tx
        .update(schema.applications)
        .set({ status: "approved", decidedAt: now() })
        .where(eq(schema.applications.id, input.applicationId));
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message === "bed-taken") {
      return { ok: false, reason: "bed-taken" };
    }
    throw error;
  }
}

/* --------------------------------------------------------------- payments */

/** Atomically bumps and returns the receipt counter so tracking numbers stay unique. */
export async function nextReceiptSequence(): Promise<number> {
  if (!isDatabaseConfigured()) {
    let seq = 1;
    await updateJsonStore((db) => {
      seq = db.counters.receiptSeq + 1;
      db.counters.receiptSeq = seq;
    });
    return seq;
  }
  const [row] = await getDb()
    .insert(schema.counters)
    .values({ name: "receipt", value: 1 })
    .onConflictDoUpdate({
      target: schema.counters.name,
      set: { value: sql`${schema.counters.value} + 1` },
    })
    .returning({ value: schema.counters.value });
  return row.value;
}

export async function recordPayment(payment: Payment, receipt: Receipt): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.payments.push(payment);
      db.receipts.push(receipt);
    });
    return;
  }
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(schema.payments).values({
      id: payment.id,
      studentId: payment.studentId,
      amount: payment.amount,
      method: payment.method,
      payerPhone: payment.payerPhone,
      reference: payment.reference,
      semester: payment.semester,
      status: payment.status,
      createdAt: payment.createdAt,
    });
    await tx.insert(schema.receipts).values({
      id: receipt.id,
      paymentId: receipt.paymentId,
      tracking: receipt.tracking,
      issuedAt: receipt.issuedAt,
    });
  });
}

/* ------------------------------------------------------------ maintenance */

export async function createTicket(ticket: MaintenanceTicket): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.tickets.push(ticket);
    });
    return;
  }
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(schema.maintenanceTickets).values({
      id: ticket.id,
      roomId: ticket.roomId,
      studentId: ticket.studentId,
      category: ticket.category,
      description: ticket.description,
      photos: ticket.photos,
      status: ticket.status,
      createdAt: ticket.createdAt,
    });
    if (ticket.studentId) {
      // The reporter's own vote is recorded in the same transaction.
      await tx
        .insert(schema.ticketVotes)
        .values({ ticketId: ticket.id, studentId: ticket.studentId });
    }
  });
}

export async function addTicketVote(ticketId: string, studentId: string): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      const ticket = db.tickets.find((t) => t.id === ticketId);
      if (ticket && !ticket.votes.includes(studentId)) ticket.votes.push(studentId);
    });
    return;
  }
  await getDb()
    .insert(schema.ticketVotes)
    .values({ ticketId, studentId })
    .onConflictDoNothing();
}

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      const ticket = db.tickets.find((t) => t.id === ticketId);
      if (ticket) ticket.status = status;
    });
    return;
  }
  await getDb()
    .update(schema.maintenanceTickets)
    .set({ status })
    .where(eq(schema.maintenanceTickets.id, ticketId));
}

/* -------------------------------------------------------------- transfers */

export async function createTransferRequest(transfer: TransferRequest): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.transfers.push(transfer);
    });
    return;
  }
  await getDb().insert(schema.transferRequests).values({
    id: transfer.id,
    studentId: transfer.studentId,
    fromAllocationId: transfer.fromAllocationId,
    toHostelId: transfer.toHostelId,
    reason: transfer.reason,
    status: transfer.status,
    createdAt: transfer.createdAt,
  });
}

/**
 * Review a transfer. Approving moves the student into the first free bed of the
 * requested hostel, releases the previous bed and reissues the QR check-in code.
 */
export async function reviewTransferRequest(input: {
  transferId: string;
  decision: "approve" | "reject";
  note?: string;
}): Promise<{ ok: boolean; reason?: "no-bed" | "no-allocation" }> {
  if (!isDatabaseConfigured()) {
    let outcome: { ok: boolean; reason?: "no-bed" | "no-allocation" } = { ok: true };
    await updateJsonStore((db) => {
      const transfer = db.transfers.find((t) => t.id === input.transferId);
      if (!transfer) return;
      const allocation = db.allocations.find((a) => a.id === transfer.fromAllocationId);
      if (input.decision === "approve") {
        if (!allocation) {
          outcome = { ok: false, reason: "no-allocation" };
          return;
        }
        const targetRoom = db.rooms.find(
          (r) => r.hostelId === transfer.toHostelId && r.beds.some((b) => !b.occupantId),
        );
        const targetBed = targetRoom?.beds.find((b) => !b.occupantId);
        if (!targetRoom || !targetBed) {
          outcome = { ok: false, reason: "no-bed" };
          return;
        }
        const currentBed = db.rooms
          .find((r) => r.id === allocation.roomId)
          ?.beds.find((b) => b.id === allocation.bedId);
        if (currentBed) currentBed.occupantId = null;
        targetBed.occupantId = allocation.studentId;
        allocation.hostelId = transfer.toHostelId;
        allocation.roomId = targetRoom.id;
        allocation.bedId = targetBed.id;
        allocation.checkedInAt = null;
        allocation.checkedOutAt = null;
        allocation.checkInCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
        transfer.status = "approved";
      } else {
        transfer.status = "rejected";
      }
      transfer.reviewerNote =
        input.note || (input.decision === "approve" ? "Transferred by hostel office." : "Request declined by hostel office.");
    });
    return outcome;
  }

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [transfer] = await tx
        .select()
        .from(schema.transferRequests)
        .where(eq(schema.transferRequests.id, input.transferId))
        .limit(1);
      if (!transfer) throw new Error("transfer-not-found");

      if (input.decision === "approve") {
        const [allocation] = await tx
          .select()
          .from(schema.allocations)
          .where(eq(schema.allocations.id, transfer.fromAllocationId))
          .limit(1);
        if (!allocation) throw new Error("no-allocation");

        const [targetBed] = await tx
          .select({ id: schema.beds.id, roomId: schema.beds.roomId })
          .from(schema.beds)
          .innerJoin(schema.rooms, eq(schema.rooms.id, schema.beds.roomId))
          .where(
            and(
              eq(schema.rooms.hostelId, transfer.toHostelId),
              isNull(schema.beds.occupantId),
            ),
          )
          .limit(1);
        if (!targetBed) throw new Error("no-bed");

        const claimed = await tx
          .update(schema.beds)
          .set({ occupantId: allocation.studentId })
          .where(and(eq(schema.beds.id, targetBed.id), isNull(schema.beds.occupantId)))
          .returning({ id: schema.beds.id });
        if (claimed.length === 0) throw new Error("no-bed");

        await tx
          .update(schema.beds)
          .set({ occupantId: null })
          .where(and(eq(schema.beds.id, allocation.bedId), eq(schema.beds.roomId, allocation.roomId)));

        await tx
          .update(schema.allocations)
          .set({
            hostelId: transfer.toHostelId,
            roomId: targetBed.roomId,
            bedId: targetBed.id,
            checkedInAt: null,
            checkedOutAt: null,
            checkInCode: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
          })
          .where(eq(schema.allocations.id, allocation.id));
      }

      await tx
        .update(schema.transferRequests)
        .set({
          status: input.decision === "approve" ? "approved" : "rejected",
          reviewerNote:
            input.note ||
            (input.decision === "approve"
              ? "Transferred by hostel office."
              : "Request declined by hostel office."),
        })
        .where(eq(schema.transferRequests.id, input.transferId));
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "no-bed") return { ok: false, reason: "no-bed" };
      if (error.message === "no-allocation") return { ok: false, reason: "no-allocation" };
    }
    throw error;
  }
}

/* ------------------------------------------------------------- complaints */

export async function createNoiseComplaint(complaint: NoiseComplaint): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.complaints.push(complaint);
    });
    return;
  }
  await getDb().insert(schema.noiseComplaints).values({
    id: complaint.id,
    hostelId: complaint.hostelId,
    location: complaint.location,
    description: complaint.description,
    status: complaint.status,
    createdAt: complaint.createdAt,
  });
}

export async function setComplaintStatus(
  complaintId: string,
  status: NoiseComplaint["status"],
): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      const complaint = db.complaints.find((c) => c.id === complaintId);
      if (complaint) complaint.status = status;
    });
    return;
  }
  await getDb()
    .update(schema.noiseComplaints)
    .set({ status, resolvedAt: status === "resolved" ? now() : null })
    .where(eq(schema.noiseComplaints.id, complaintId));
}

/* ----------------------------------------------------------- lost & found */

export async function createLostFoundItem(item: LostFoundItem): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.lostFound.push(item);
    });
    return;
  }
  await getDb().insert(schema.lostFoundItems).values({
    id: item.id,
    kind: item.kind,
    title: item.title,
    description: item.description,
    location: item.location,
    contact: item.contact,
    reporterName: item.reporterName,
    status: item.status,
    createdAt: item.createdAt,
  });
}

export async function toggleLostFoundItem(itemId: string, nextStatus: "open" | "closed"): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      const item = db.lostFound.find((i) => i.id === itemId);
      if (item) item.status = nextStatus;
    });
    return;
  }
  await getDb()
    .update(schema.lostFoundItems)
    .set({ status: nextStatus })
    .where(eq(schema.lostFoundItems.id, itemId));
}

/* ------------------------------------------------------------ inspections */

export async function createInspection(inspection: Inspection): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      db.inspections.push(inspection);
    });
    return;
  }
  await getDb().insert(schema.inspections).values({
    id: inspection.id,
    roomId: inspection.roomId,
    inspectorId: inspection.inspectorId,
    condition: inspection.condition,
    notes: inspection.notes,
    photos: inspection.photos,
    createdAt: inspection.createdAt,
  });
}

/* ---------------------------------------------------------- QR check-in */

export async function recordCheckEvent(input: {
  allocation: Allocation;
  type: "in" | "out";
  at: string;
  byId: string;
  eventId: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    await updateJsonStore((db) => {
      const allocation = db.allocations.find((a) => a.id === input.allocation.id);
      if (!allocation) return;
      if (input.type === "in") {
        allocation.checkedInAt = input.at;
        allocation.checkedOutAt = null;
      } else {
        allocation.checkedOutAt = input.at;
      }
      db.checkEvents.push({
        id: input.eventId,
        allocationId: allocation.id,
        type: input.type,
        at: input.at,
        code: allocation.checkInCode,
        byId: input.byId,
      });
    });
    return;
  }
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.allocations)
      .set(
        input.type === "in"
          ? { checkedInAt: input.at, checkedOutAt: null }
          : { checkedOutAt: input.at },
      )
      .where(eq(schema.allocations.id, input.allocation.id));
    await tx.insert(schema.checkEvents).values({
      id: input.eventId,
      allocationId: input.allocation.id,
      type: input.type,
      at: input.at,
      code: input.allocation.checkInCode,
      byId: input.byId,
    });
  });
}