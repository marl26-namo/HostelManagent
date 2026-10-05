"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSession,
  requireRole,
  roleHome,
  setSession,
  verifyPassword,
} from "./auth";
import { readDb, writeDb } from "./db";
import { hashPassword } from "./password";
import type { Allocation, Db, PaymentMethod, ScanResult, User } from "./types";
import { newId, receiptTracking, safeReturnPath, semesterNow } from "./utils";

export type AuthState = { error?: string };

function refreshAll(): void {
  revalidatePath("/", "layout");
}

function flash(path: string, key: string, value: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`);
}

async function collectPhotos(formData: FormData, field = "photos"): Promise<string[]> {
  const files = formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  const photos: string[] = [];
  for (const file of files.slice(0, 4)) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > 3 * 1024 * 1024) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    photos.push(`data:${file.type};base64,${buffer.toString("base64")}`);
  }
  return photos;
}

/* ------------------------------------------------------------------ auth */

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password. Check the demo accounts below the form." };
  }
  await setSession(user.id);
  redirect(safeReturnPath(returnTo, roleHome(user.role)));
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const regNumber = String(formData.get("regNumber") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");

  if (name.length < 3) return { error: "Please enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { error: "An account with that email already exists — sign in instead." };
  }
  const user: User = {
    id: newId("u"),
    name,
    email,
    passwordHash: hashPassword(password),
    role: "student",
    regNumber: regNumber || undefined,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);
  await setSession(user.id);
  refreshAll();
  redirect(safeReturnPath(returnTo, roleHome(user.role)));
}

export async function signOutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}

/* --------------------------------------------------------------- booking */

export async function applyForBooking(formData: FormData): Promise<void> {
  const user = await requireRole(["student"]);
  const hostelId = String(formData.get("hostelId") ?? "");
  const db = readDb();
  const hostel = db.hostels.find((h) => h.id === hostelId);
  if (!hostel) flash("/dashboard/booking", "error", "Unknown hostel selection.");

  const semester = semesterNow();
  const allocated = db.allocations.some((a) => a.studentId === user.id && a.semester === semester);
  if (allocated) flash("/dashboard/booking", "error", "You already hold a bed for this semester.");

  const existing = db.applications.find(
    (a) => a.studentId === user.id && a.semester === semester && a.status !== "rejected",
  );
  if (existing) flash("/dashboard/booking", "error", "Your application is already with the hostel office.");

  db.applications.push({
    id: newId("ap"),
    studentId: user.id,
    hostelId,
    semester,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  refreshAll();
  flash("/dashboard/booking", "ok", `Application for ${hostel.name} submitted.`);
}

export async function reviewApplication(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const db = readDb();
  const application = db.applications.find((a) => a.id === applicationId);
  if (!application || application.status !== "pending") {
    flash("/admin/applications", "error", "That application is no longer pending.");
  }

  if (decision === "reject") {
    application.status = "rejected";
    application.note = String(formData.get("note") ?? "").slice(0, 300) || "Rejected by hostel office.";
    writeDb(db);
    refreshAll();
    flash("/admin/applications", "ok", "Application rejected.");
  }

  const [roomId, bedId] = String(formData.get("slot") ?? "").split("|");
  const room = db.rooms.find((r) => r.id === roomId);
  const bed = room?.beds.find((b) => b.id === bedId);
  if (!room || !bed) flash("/admin/applications", "error", "Select a free bed before approving.");
  if (bed.occupantId) flash("/admin/applications", "error", "That bed was just taken — pick another.");

  const semester = semesterNow();
  bed.occupantId = application.studentId;
  const allocation: Allocation = {
    id: newId("al"),
    studentId: application.studentId,
    hostelId: room.hostelId,
    roomId: room.id,
    bedId: bed.id,
    semester,
    checkInCode: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    checkedInAt: null,
    checkedOutAt: null,
    createdAt: new Date().toISOString(),
  };
  db.allocations.push(allocation);
  application.status = "approved";
  writeDb(db);
  refreshAll();
  flash("/admin/applications", "ok", `Bed ${room.number} · ${bed.label} allocated.`);
}

/* -------------------------------------------------------------- payments */

const FEE_PLANS: Record<string, number> = { semester: 108000, month: 27000 };
const METHODS: PaymentMethod[] = ["airtel-money", "tnm-mpamba", "bank-transfer"];

export async function makePayment(formData: FormData): Promise<void> {
  const user = await requireRole(["student"]);
  const method = String(formData.get("method") ?? "") as PaymentMethod;
  const plan = String(formData.get("plan") ?? "semester");
  const payerPhone = String(formData.get("payerPhone") ?? "").trim();

  if (!METHODS.includes(method)) flash("/dashboard/payments", "error", "Choose a payment method.");
  const amount = FEE_PLANS[plan];
  if (!amount) flash("/dashboard/payments", "error", "Choose a payment plan.");
  if (method !== "bank-transfer" && payerPhone.length < 9) {
    flash("/dashboard/payments", "error", "Enter the mobile money number the payment is made from.");
  }

  const db = readDb();
  const semester = semesterNow();
  const seq = db.counters.receiptSeq++;
  const paymentId = newId("pay");
  const prefix = method === "airtel-money" ? "AM" : method === "tnm-mpamba" ? "TM" : "NB";
  const nowIso = new Date().toISOString();

  db.payments.push({
    id: paymentId,
    studentId: user.id,
    amount,
    method,
    payerPhone: payerPhone || "—",
    reference: `${prefix}-DEMO-${String(1000 + seq)}`,
    semester,
    status: "paid",
    createdAt: nowIso,
  });
  db.receipts.push({
    id: newId("rc"),
    paymentId,
    tracking: receiptTracking(seq),
    issuedAt: nowIso,
  });
  writeDb(db);
  refreshAll();
  flash("/dashboard/payments", "ok", "Payment confirmed — your receipt has been issued.");
}

/* ------------------------------------------------------------ maintenance */

export async function submitTicket(formData: FormData): Promise<void> {
  const user = await requireRole(["student"]);
  const roomId = String(formData.get("roomId") ?? "");
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (description.length < 10) {
    flash("/dashboard/maintenance", "error", "Describe the problem in at least a sentence.");
  }
  const db = readDb();
  if (!db.rooms.some((r) => r.id === roomId)) {
    flash("/dashboard/maintenance", "error", "Select the room that needs attention.");
  }

  db.tickets.push({
    id: newId("mt"),
    roomId,
    studentId: user.id,
    category: category || "General",
    description,
    photos: await collectPhotos(formData),
    votes: [user.id],
    status: "open",
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  refreshAll();
  flash("/dashboard/maintenance", "ok", "Report submitted — residents can now second it.");
}

export async function voteTicket(formData: FormData): Promise<void> {
  const user = await requireRole(["student"]);
  const ticketId = String(formData.get("ticketId") ?? "");
  const db = readDb();
  const ticket = db.tickets.find((t) => t.id === ticketId);
  if (!ticket) flash("/dashboard/maintenance", "error", "Ticket not found.");
  if (ticket.votes.includes(user.id)) {
    flash("/dashboard/maintenance", "error", "You have already seconded this report.");
  }
  ticket.votes.push(user.id);
  writeDb(db);
  refreshAll();
}

export async function setTicketStatus(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "");
  const db = readDb();
  const ticket = db.tickets.find((t) => t.id === ticketId);
  if (!ticket || !["open", "in-progress", "resolved"].includes(status)) return;
  ticket.status = status as typeof ticket.status;
  writeDb(db);
  refreshAll();
}

/* ------------------------------------------------------------- transfers */

export async function requestTransfer(formData: FormData): Promise<void> {
  const user = await requireRole(["student"]);
  const toHostelId = String(formData.get("toHostelId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 10) flash("/dashboard/transfers", "error", "Give the office a clear reason.");

  const db = readDb();
  const allocation = db.allocations.find(
    (a) => a.studentId === user.id && a.semester === semesterNow(),
  );
  if (!allocation) flash("/dashboard/transfers", "error", "You need an allocated bed before transferring.");
  if (allocation.hostelId === toHostelId) {
    flash("/dashboard/transfers", "error", "That is already your current hostel.");
  }
  const pending = db.transfers.find(
    (t) => t.studentId === user.id && t.status === "pending",
  );
  if (pending) flash("/dashboard/transfers", "error", "You already have a transfer awaiting review.");

  db.transfers.push({
    id: newId("tr"),
    studentId: user.id,
    fromAllocationId: allocation.id,
    toHostelId,
    reason,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  refreshAll();
  flash("/dashboard/transfers", "ok", "Transfer request sent to the hostel office.");
}

function moveAllocation(db: Db, allocation: Allocation, toHostelId: string): boolean {
  const targetRoom = db.rooms.find((r) => r.hostelId === toHostelId && r.beds.some((b) => !b.occupantId));
  if (!targetRoom) return false;
  const targetBed = targetRoom.beds.find((b) => !b.occupantId)!;
  const currentRoom = db.rooms.find((r) => r.id === allocation.roomId);
  const currentBed = currentRoom?.beds.find((b) => b.id === allocation.bedId);
  if (currentBed) currentBed.occupantId = null;
  targetBed.occupantId = allocation.studentId;
  allocation.hostelId = toHostelId;
  allocation.roomId = targetRoom.id;
  allocation.bedId = targetBed.id;
  allocation.checkedInAt = null;
  allocation.checkedOutAt = null;
  allocation.checkInCode = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return true;
}

export async function reviewTransfer(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const transferId = String(formData.get("transferId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 300);

  const db = readDb();
  const transfer = db.transfers.find((t) => t.id === transferId);
  if (!transfer || transfer.status !== "pending") {
    flash("/admin/transfers", "error", "That request is no longer pending.");
  }
  const allocation = db.allocations.find((a) => a.id === transfer.fromAllocationId);

  if (decision === "approve") {
    if (!allocation) flash("/admin/transfers", "error", "Student no longer holds a bed.");
    if (!moveAllocation(db, allocation, transfer.toHostelId)) {
      flash("/admin/transfers", "error", "No free bed in the requested hostel.");
    }
    transfer.status = "approved";
    transfer.reviewerNote = note || "Transferred by hostel office.";
  } else {
    transfer.status = "rejected";
    transfer.reviewerNote = note || "Request declined by hostel office.";
  }
  writeDb(db);
  refreshAll();
  flash("/admin/transfers", "ok", `Transfer ${transfer.status}.`);
}

/* ------------------------------------------------------------- complaints */

export async function submitComplaint(formData: FormData): Promise<void> {
  await requireRole(["student"]);
  const hostelId = String(formData.get("hostelId") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 10) {
    flash("/dashboard/complaints", "error", "Tell us a little more about the disturbance.");
  }

  const db = readDb();
  // Intentionally anonymous: no student identity is stored with the complaint.
  db.complaints.push({
    id: newId("nc"),
    hostelId,
    location: location || "Not specified",
    description,
    status: "new",
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  refreshAll();
  flash("/dashboard/complaints", "ok", "Complaint logged anonymously.");
}

export async function setComplaintStatus(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = String(formData.get("complaintId") ?? "");
  const status = String(formData.get("status") ?? "");
  const db = readDb();
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint || !["new", "acknowledged", "resolved"].includes(status)) return;
  complaint.status = status as typeof complaint.status;
  writeDb(db);
  refreshAll();
}

/* ----------------------------------------------------------- lost & found */

export async function reportLostFound(formData: FormData): Promise<void> {
  const user = await requireRole(["student"]);
  const kind = String(formData.get("kind") ?? "lost");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (title.length < 4 || description.length < 10) {
    flash("/dashboard/lost-found", "error", "Add a clear title and description.");
  }
  const db = readDb();
  db.lostFound.push({
    id: newId("lf"),
    kind: kind === "found" ? "found" : "lost",
    title,
    description,
    location: location || "Not specified",
    contact: contact || user.email,
    reporterName: user.name,
    status: "open",
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  refreshAll();
  flash("/dashboard/lost-found", "ok", "Item posted to the lost & found board.");
}

export async function closeLostFound(formData: FormData): Promise<void> {
  await requireRole(["admin"]);
  const id = String(formData.get("itemId") ?? "");
  const db = readDb();
  const item = db.lostFound.find((i) => i.id === id);
  if (!item) return;
  item.status = item.status === "open" ? "closed" : "open";
  writeDb(db);
  refreshAll();
}

/* ------------------------------------------------------------ inspections */

export async function recordInspection(formData: FormData): Promise<void> {
  const admin = await requireRole(["admin"]);
  const roomId = String(formData.get("roomId") ?? "");
  const condition = String(formData.get("condition") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!["good", "fair", "poor"].includes(condition)) {
    flash("/admin/inspections", "error", "Record the room condition.");
  }
  const db = readDb();
  if (!db.rooms.some((r) => r.id === roomId)) {
    flash("/admin/inspections", "error", "Select the inspected room.");
  }
  db.inspections.push({
    id: newId("in"),
    roomId,
    inspectorId: admin.id,
    condition: condition as "good" | "fair" | "poor",
    notes: notes || "No additional notes.",
    photos: await collectPhotos(formData),
    createdAt: new Date().toISOString(),
  });
  writeDb(db);
  refreshAll();
  flash("/admin/inspections", "ok", "Inspection recorded with photo evidence.");
}

/* ------------------------------------------------------------ QR check-in */

export async function scanCheckIn(formData: FormData): Promise<ScanResult> {
  const guard = await requireRole(["admin", "security"]);
  const raw = String(formData.get("code") ?? "").trim();
  const direction = formData.get("direction") === "out" ? "out" : "in";

  const code = raw.replace(/^MUBAS-CI:/i, "");
  const [allocationId, token] = code.split(":");

  const db = readDb();
  const allocation = db.allocations.find(
    (a) => (a.id === allocationId || a.checkInCode === token) && a.checkInCode === token,
  );
  if (!allocation) {
    return { ok: false, message: "Unknown check-in code", detail: `"${raw}" does not match any active allocation.` };
  }

  const student = db.users.find((u) => u.id === allocation.studentId);
  const room = db.rooms.find((r) => r.id === allocation.roomId);
  const hostel = db.hostels.find((h) => h.id === allocation.hostelId);
  if (!student || !room || !hostel) {
    return { ok: false, message: "Allocation record incomplete", detail: "Contact the hostel office." };
  }

  const at = new Date().toISOString();
  if (direction === "in") {
    allocation.checkedInAt = at;
    allocation.checkedOutAt = null;
  } else {
    allocation.checkedOutAt = at;
  }
  db.checkEvents.push({
    id: newId("ck"),
    allocationId: allocation.id,
    type: direction,
    at,
    code: allocation.checkInCode,
    byId: guard.id,
  });
  writeDb(db);
  refreshAll();

  return {
    ok: true,
    message: `${student.name} ${direction === "in" ? "checked in" : "checked out"}`,
    detail: `${hostel.name} · Room ${room.number} · ${room.beds.find((b) => b.id === allocation.bedId)?.label ?? ""} · ${new Date(at).toLocaleString("en-GB")}`,
  };
}
