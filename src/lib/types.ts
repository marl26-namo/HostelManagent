export type Role = "student" | "admin" | "security";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  regNumber?: string;
  program?: string;
  year?: number;
  phone?: string;
  createdAt: string;
}

export type HostelGender = "male" | "female" | "open";

export interface Hostel {
  id: string;
  name: string;
  gender: HostelGender;
  campus: "on-campus" | "off-campus";
  location: string;
  description: string;
  monthlyFee: number;
}

export interface Bed {
  id: string;
  label: string;
  occupantId: string | null;
}

export interface Room {
  id: string;
  hostelId: string;
  number: string;
  beds: Bed[];
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  studentId: string;
  hostelId: string;
  semester: string;
  status: ApplicationStatus;
  createdAt: string;
  note?: string;
}

export interface Allocation {
  id: string;
  studentId: string;
  hostelId: string;
  roomId: string;
  bedId: string;
  semester: string;
  checkInCode: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  createdAt: string;
}

export type PaymentMethod = "airtel-money" | "tnm-mpamba" | "bank-transfer";

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  payerPhone: string;
  reference: string;
  semester: string;
  status: "paid" | "pending" | "flagged";
  createdAt: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  tracking: string;
  issuedAt: string;
}

export type TicketStatus = "open" | "in-progress" | "resolved";

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  studentId: string | null;
  category: string;
  description: string;
  photos: string[];
  votes: string[];
  status: TicketStatus;
  createdAt: string;
}

export interface TransferRequest {
  id: string;
  studentId: string;
  fromAllocationId: string;
  toHostelId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewerNote?: string;
  createdAt: string;
}

export interface NoiseComplaint {
  id: string;
  hostelId: string;
  location: string;
  description: string;
  status: "new" | "acknowledged" | "resolved";
  createdAt: string;
}

export interface LostFoundItem {
  id: string;
  kind: "lost" | "found";
  title: string;
  description: string;
  location: string;
  contact: string;
  reporterName: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface Inspection {
  id: string;
  roomId: string;
  inspectorId: string;
  condition: "good" | "fair" | "poor";
  notes: string;
  photos: string[];
  createdAt: string;
}

export interface CheckEvent {
  id: string;
  allocationId: string;
  type: "in" | "out";
  at: string;
  code: string;
  byId: string;
}

export interface ScanResult {
  ok: boolean;
  message: string;
  detail?: string;
}

export interface Db {
  users: User[];
  hostels: Hostel[];
  rooms: Room[];
  applications: Application[];
  allocations: Allocation[];
  payments: Payment[];
  receipts: Receipt[];
  tickets: MaintenanceTicket[];
  transfers: TransferRequest[];
  complaints: NoiseComplaint[];
  lostFound: LostFoundItem[];
  inspections: Inspection[];
  checkEvents: CheckEvent[];
  counters: { receiptSeq: number };
}
