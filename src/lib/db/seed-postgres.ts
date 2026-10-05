import { getDb, schema } from "./client";
import { buildSeed } from "../seed";

/**
 * Seeds Postgres with the MUBAS demo dataset (8 hostels, 76 rooms, 304 beds,
 * students, allocations, payments, receipts, tickets, complaints and inspections).
 *
 * The seed is idempotent: if a user row already exists the function returns
 * without writing, so re-running the setup script is safe.
 */
export async function seedPostgres(): Promise<boolean> {
  const db = getDb();
  const existing = await db.select({ id: schema.users.id }).from(schema.users).limit(1);
  if (existing.length > 0) return false;

  const seed = buildSeed();

  await db.transaction(async (tx) => {
    await tx.insert(schema.users).values(
      seed.users.map((user) => ({
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
      })),
    );

    await tx.insert(schema.hostels).values(
      seed.hostels.map((hostel) => ({
        id: hostel.id,
        name: hostel.name,
        gender: hostel.gender,
        campus: hostel.campus,
        location: hostel.location,
        description: hostel.description,
        monthlyFee: hostel.monthlyFee,
        amenities: hostel.amenities ?? [],
        photoUrl: hostel.photoUrl ?? null,
        rating: hostel.rating ?? null,
      })),
    );

    await tx.insert(schema.rooms).values(
      seed.rooms.map((room) => ({
        id: room.id,
        hostelId: room.hostelId,
        number: room.number,
        floor: room.floor ?? null,
      })),
    );

    await tx.insert(schema.beds).values(
      seed.rooms.flatMap((room) =>
        room.beds.map((bed) => ({
          id: bed.id,
          roomId: room.id,
          label: bed.label,
          occupantId: bed.occupantId,
        })),
      ),
    );

    await tx.insert(schema.applications).values(
      seed.applications.map((application) => ({
        id: application.id,
        studentId: application.studentId,
        hostelId: application.hostelId,
        semester: application.semester,
        status: application.status,
        note: application.note ?? null,
        decidedAt: application.status === "pending" ? null : application.createdAt,
        createdAt: application.createdAt,
      })),
    );

    await tx.insert(schema.allocations).values(
      seed.allocations.map((allocation) => ({
        id: allocation.id,
        studentId: allocation.studentId,
        hostelId: allocation.hostelId,
        roomId: allocation.roomId,
        bedId: allocation.bedId,
        semester: allocation.semester,
        status: allocation.status ?? "active",
        checkInCode: allocation.checkInCode,
        checkedInAt: allocation.checkedInAt,
        checkedOutAt: allocation.checkedOutAt,
        createdAt: allocation.createdAt,
      })),
    );

    await tx.insert(schema.payments).values(
      seed.payments.map((payment) => ({
        id: payment.id,
        studentId: payment.studentId,
        amount: payment.amount,
        method: payment.method,
        payerPhone: payment.payerPhone,
        reference: payment.reference,
        semester: payment.semester,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
    );

    await tx.insert(schema.receipts).values(
      seed.receipts.map((receipt) => ({
        id: receipt.id,
        paymentId: receipt.paymentId,
        tracking: receipt.tracking,
        issuedAt: receipt.issuedAt,
      })),
    );

    await tx.insert(schema.counters).values({ name: "receipt", value: seed.counters.receiptSeq });

    await tx.insert(schema.maintenanceTickets).values(
      seed.tickets.map((ticket) => ({
        id: ticket.id,
        roomId: ticket.roomId,
        studentId: ticket.studentId,
        category: ticket.category,
        description: ticket.description,
        photos: ticket.photos,
        status: ticket.status,
        createdAt: ticket.createdAt,
      })),
    );

    await tx.insert(schema.ticketVotes).values(
      seed.tickets.flatMap((ticket) =>
        ticket.votes.map((studentId) => ({ ticketId: ticket.id, studentId })),
      ),
    );

    await tx.insert(schema.transferRequests).values(
      seed.transfers.map((transfer) => ({
        id: transfer.id,
        studentId: transfer.studentId,
        fromAllocationId: transfer.fromAllocationId,
        toHostelId: transfer.toHostelId,
        reason: transfer.reason,
        status: transfer.status,
        reviewerNote: transfer.reviewerNote ?? null,
        createdAt: transfer.createdAt,
      })),
    );

    await tx.insert(schema.noiseComplaints).values(
      seed.complaints.map((complaint) => ({
        id: complaint.id,
        hostelId: complaint.hostelId,
        location: complaint.location,
        description: complaint.description,
        status: complaint.status,
        resolvedAt: complaint.status === "resolved" ? complaint.createdAt : null,
        createdAt: complaint.createdAt,
      })),
    );

    await tx.insert(schema.lostFoundItems).values(
      seed.lostFound.map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        description: item.description,
        location: item.location,
        contact: item.contact,
        reporterName: item.reporterName,
        status: item.status,
        createdAt: item.createdAt,
      })),
    );

    await tx.insert(schema.inspections).values(
      seed.inspections.map((inspection) => ({
        id: inspection.id,
        roomId: inspection.roomId,
        inspectorId: inspection.inspectorId,
        condition: inspection.condition,
        notes: inspection.notes,
        photos: inspection.photos,
        createdAt: inspection.createdAt,
      })),
    );

    await tx.insert(schema.checkEvents).values(
      seed.checkEvents.map((event) => ({
        id: event.id,
        allocationId: event.allocationId,
        type: event.type,
        at: event.at,
        code: event.code,
        byId: event.byId,
      })),
    );
  });

  return true;
}