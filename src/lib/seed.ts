import { hashPassword } from "./password";
import type {
  Allocation,
  Application,
  Db,
  Hostel,
  MaintenanceTicket,
  NoiseComplaint,
  Payment,
  Receipt,
  Room,
  User,
} from "./types";

const SEMESTER = "2026/27 · Semester 1";
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

const HOSTELS: Hostel[] = [
  {
    id: "nyika",
    name: "Nyika Hostel",
    gender: "male",
    campus: "on-campus",
    location: "Main Campus, Blantyre",
    description:
      "A long-standing on-campus hostel a short walk from the library, lecture theatres and the dining hall.",
    monthlyFee: 27000,
  },
  {
    id: "mpingwe",
    name: "Mpingwe Hostel",
    gender: "male",
    campus: "on-campus",
    location: "Main Campus, Blantyre",
    description:
      "Quiet, tree-lined on-campus residences popular with returning students who value proximity to laboratories.",
    monthlyFee: 27000,
  },
  {
    id: "ndirande-a",
    name: "Ndirande A Hostel",
    gender: "male",
    campus: "on-campus",
    location: "Ndirande, Blantyre",
    description:
      "On-campus male hostel with shared study lounges and 24-hour security at the main gate.",
    monthlyFee: 27000,
  },
  {
    id: "hyrid",
    name: "Hyrid Hostel",
    gender: "female",
    campus: "on-campus",
    location: "Main Campus, Blantyre",
    description:
      "Female on-campus hostel with Wi-Fi zones, laundry lines and direct access to the campus clinic.",
    monthlyFee: 27000,
  },
  {
    id: "kapeni",
    name: "Kapeni Hostel",
    gender: "female",
    campus: "on-campus",
    location: "Main Campus, Blantyre",
    description:
      "Female on-campus hostel known for its resident mentorship programme and well-lit courtyards.",
    monthlyFee: 27000,
  },
  {
    id: "ndirande-b",
    name: "Ndirande B Hostel",
    gender: "female",
    campus: "on-campus",
    location: "Ndirande, Blantyre",
    description:
      "Female hostel adjacent to Ndirande A, sharing security patrols and recreational spaces.",
    monthlyFee: 27000,
  },
  {
    id: "chichiri",
    name: "Chichiri Hostel",
    gender: "open",
    campus: "off-campus",
    location: "Chichiri, Blantyre",
    description:
      "Off-campus hostel predominantly hosting first-year students, a short minibus ride from main campus.",
    monthlyFee: 27000,
  },
  {
    id: "poly-alley",
    name: "Poly Alley Hostel",
    gender: "open",
    campus: "off-campus",
    location: "Poly Alley, Blantyre",
    description:
      "Off-campus residences with compact shared rooms, popular with students on practical attachment.",
    monthlyFee: 27000,
  },
];

const PREFIX: Record<string, string> = {
  nyika: "NY",
  mpingwe: "MP",
  "ndirande-a": "NDA",
  hyrid: "HY",
  kapeni: "KA",
  "ndirande-b": "NDB",
  chichiri: "CH",
  "poly-alley": "PA",
};

interface StudentSeed {
  id: string;
  name: string;
  email: string;
  regNumber: string;
  program: string;
  year: number;
}

const STUDENTS: StudentSeed[] = [
  { id: "s_defton", name: "Defton Makwale", email: "student@mubas.ac.mw", regNumber: "BIS/22/EP/015", program: "BSc Information Systems", year: 4 },
  { id: "s_james", name: "James Liko", email: "james@mubas.ac.mw", regNumber: "BCS/23/EP/042", program: "BSc Computer Science", year: 3 },
  { id: "s_mary", name: "Mary Kamanga", email: "mary@mubas.ac.mw", regNumber: "BIS/23/EP/061", program: "BSc Information Systems", year: 3 },
  { id: "s_stella", name: "Stella Chilenje", email: "stella@mubas.ac.mw", regNumber: "BCS/24/EP/118", program: "BSc Computer Science", year: 2 },
  { id: "s_thoko", name: "Thoko Nelson", email: "thoko@mubas.ac.mw", regNumber: "BEIT/22/EP/009", program: "BEng Information Technology", year: 4 },
  { id: "s_achen", name: "Achen Mbewe", email: "achen@mubas.ac.mw", regNumber: "BIS/24/EP/133", program: "BSc Information Systems", year: 2 },
  { id: "s_yankho", name: "Yankho Chirwa", email: "yankho@mubas.ac.mw", regNumber: "BCS/23/EP/075", program: "BSc Computer Science", year: 3 },
  { id: "s_frank", name: "Frank Kachale", email: "frank@mubas.ac.mw", regNumber: "BEIT/24/EP/024", program: "BEng Information Technology", year: 2 },
  { id: "s_maria", name: "Maria Chirwa", email: "maria@mubas.ac.mw", regNumber: "BCS/24/EP/077", program: "BSc Computer Science", year: 2 },
  { id: "s_peter", name: "Peter Gama", email: "peter@mubas.ac.mw", regNumber: "BEIT/23/EP/051", program: "BEng Information Technology", year: 3 },
];

const ALLOCATION_PLAN: Array<{ studentId: string; hostelId: string; room: number; bed: number }> = [
  { studentId: "s_defton", hostelId: "chichiri", room: 2, bed: 1 },
  { studentId: "s_james", hostelId: "nyika", room: 3, bed: 1 },
  { studentId: "s_mary", hostelId: "kapeni", room: 5, bed: 2 },
  { studentId: "s_stella", hostelId: "hyrid", room: 4, bed: 1 },
  { studentId: "s_thoko", hostelId: "mpingwe", room: 1, bed: 3 },
  { studentId: "s_achen", hostelId: "ndirande-b", room: 6, bed: 2 },
  { studentId: "s_yankho", hostelId: "ndirande-a", room: 7, bed: 1 },
  { studentId: "s_frank", hostelId: "poly-alley", room: 3, bed: 4 },
];

function buildRooms(): Room[] {
  const rooms: Room[] = [];
  for (const hostel of HOSTELS) {
    const count = hostel.campus === "on-campus" ? 10 : 8;
    for (let i = 1; i <= count; i++) {
      const number = `${PREFIX[hostel.id]}-${String(i).padStart(2, "0")}`;
      rooms.push({
        id: `${hostel.id}_${number.toLowerCase()}`,
        hostelId: hostel.id,
        number,
        beds: Array.from({ length: 4 }, (_, b) => ({
          id: `${hostel.id}_${number.toLowerCase()}_b${b + 1}`,
          label: `Bed ${b + 1}`,
          occupantId: null,
        })),
      });
    }
  }
  return rooms;
}

function svgPhoto(label: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="420" fill="url(#g)"/><rect x="22" y="22" width="596" height="376" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" rx="20"/><text x="320" y="210" fill="#ffffff" font-family="Georgia, serif" font-size="30" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Amenities shown as chips on hostel cards and the detail view. */
const AMENITIES: Record<string, string[]> = {
  nyika: ["Security", "Wi-Fi", "Laundry", "Study room"],
  mpingwe: ["Security", "Wi-Fi", "Laundry", "Quiet block"],
  "ndirande-a": ["Security", "Wi-Fi", "Study room", "Cafeteria"],
  hyrid: ["Security", "Wi-Fi", "Laundry", "Clinic nearby"],
  kapeni: ["Security", "Wi-Fi", "Laundry", "Mentorship"],
  "ndirande-b": ["Security", "Wi-Fi", "Laundry", "Study room"],
  chichiri: ["Security", "Wi-Fi", "Laundry", "Shuttle stop"],
  "poly-alley": ["Security", "Wi-Fi", "Laundry", "Workshop nearby"],
};

export function buildSeed(): Db {
  const users: User[] = [
    ...STUDENTS.map((s, index) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      passwordHash: hashPassword("student123"),
      role: "student" as const,
      regNumber: s.regNumber,
      program: s.program,
      year: s.year,
      phone: `09${String(10000000 + index * 1371111).slice(0, 8)}`,
      createdAt: iso(60 * DAY),
    })),
    {
      id: "u_admin",
      name: "Grace Banda",
      email: "admin@mubas.ac.mw",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      program: "Department of Student Residence & Housing",
      createdAt: iso(120 * DAY),
    },
    {
      id: "u_guard",
      name: "John Phiri",
      email: "guard@mubas.ac.mw",
      passwordHash: hashPassword("guard123"),
      role: "security",
      program: "Campus Security Services",
      createdAt: iso(120 * DAY),
    },
  ];

  const rooms = buildRooms();

  const allocations: Allocation[] = [];
  const applications: Application[] = ALLOCATION_PLAN.map((plan, index) => {
    const hostel = HOSTELS.find((h) => h.id === plan.hostelId)!;
    const room = rooms.find(
      (r) => r.hostelId === plan.hostelId && r.number.endsWith(String(plan.room).padStart(2, "0")),
    )!;
    const bed = room.beds[plan.bed - 1];
    bed.occupantId = plan.studentId;
    const allocationId = `al_${plan.studentId.replace("s_", "")}`;
    allocations.push({
      id: allocationId,
      studentId: plan.studentId,
      hostelId: hostel.id,
      roomId: room.id,
      bedId: bed.id,
      semester: SEMESTER,
      checkInCode: `c0de${String(index + 1).padStart(4, "0")}beef`,
      checkedInAt: index % 3 === 0 ? iso(9 * DAY) : null,
      checkedOutAt: index % 3 === 0 ? null : iso(2 * DAY),
      createdAt: iso(30 * DAY),
    });
    return {
      id: `ap_${plan.studentId.replace("s_", "")}`,
      studentId: plan.studentId,
      hostelId: hostel.id,
      semester: SEMESTER,
      status: "approved" as const,
      createdAt: iso(32 * DAY),
    };
  });

  applications.push(
    {
      id: "ap_maria",
      studentId: "s_maria",
      hostelId: "kapeni",
      semester: SEMESTER,
      status: "pending",
      createdAt: iso(5 * DAY),
    },
    {
      id: "ap_peter",
      studentId: "s_peter",
      hostelId: "ndirande-a",
      semester: SEMESTER,
      status: "pending",
      createdAt: iso(3 * DAY),
    },
  );

  const payments: Payment[] = [];
  const receipts: Receipt[] = [];
  let seq = 1;
  for (const allocation of allocations) {
    const methods = ["airtel-money", "tnm-mpamba", "bank-transfer"] as const;
    const method = methods[seq % methods.length];
    const paymentId = `pay_${seq}`;
    payments.push({
      id: paymentId,
      studentId: allocation.studentId,
      amount: 108000,
      method,
      payerPhone: `09${String(20000000 + seq * 424242).slice(0, 8)}`,
      reference: `${method === "bank-transfer" ? "NB" : method === "airtel-money" ? "AM" : "TM"}-DEMO-${String(1000 + seq)}`,
      semester: SEMESTER,
      status: "paid",
      createdAt: iso(20 * DAY - seq * DAY),
    });
    receipts.push({
      id: `rc_${seq}`,
      paymentId,
      tracking: `MUBAS/RCPT/26/${String(seq).padStart(6, "0")}`,
      issuedAt: iso(20 * DAY - seq * DAY),
    });
    seq++;
  }

  const tickets: MaintenanceTicket[] = [
    {
      id: "mt_1",
      roomId: rooms.find((r) => r.number === "CH-02")!.id,
      studentId: "s_defton",
      category: "Plumbing",
      description: "The shower tap on the north side has been dripping constantly for a week and the drain is backing up.",
      photos: [svgPhoto("Shower block photo · CH-02", "#1f7a5c", "#071713")],
      votes: ["s_james", "s_thoko", "s_frank", "s_yankho"],
      status: "open",
      createdAt: iso(6 * DAY),
    },
    {
      id: "mt_2",
      roomId: rooms.find((r) => r.number === "NY-03")!.id,
      studentId: "s_james",
      category: "Furniture",
      description: "Study desk leg is loose and the wardrobe door keeps falling off its hinge.",
      photos: [],
      votes: ["s_defton"],
      status: "in-progress",
      createdAt: iso(11 * DAY),
    },
    {
      id: "mt_3",
      roomId: rooms.find((r) => r.number === "KA-05")!.id,
      studentId: "s_mary",
      category: "Electrical",
      description: "Two ceiling bulbs in the corridor were flickering; both replaced by the works team.",
      photos: [svgPhoto("Corridor lighting · KA-05", "#e3a72f", "#0f3d30")],
      votes: ["s_stella", "s_achen"],
      status: "resolved",
      createdAt: iso(24 * DAY),
    },
  ];

  const complaints: NoiseComplaint[] = [
    {
      id: "nc_1",
      hostelId: "chichiri",
      location: "Block C courtyard",
      description: "Loud music from the courtyard continuing past 02:00 on week nights.",
      status: "acknowledged",
      createdAt: iso(4 * DAY),
    },
    {
      id: "nc_2",
      hostelId: "nyika",
      location: "Room NY-08 corridor",
      description: "Recurring late-night conversations in the corridor right outside the rooms.",
      status: "new",
      createdAt: iso(2 * DAY),
    },
  ];

  return {
    users,
    hostels: HOSTELS.map((hostel, index) => ({
      ...hostel,
      amenities: AMENITIES[hostel.id] ?? [],
      rating: 4 + (index % 2),
    })),
    rooms,
    applications,
    allocations,
    payments,
    receipts,
    tickets,
    transfers: [
      {
        id: "tr_1",
        studentId: "s_frank",
        fromAllocationId: "al_frank",
        toHostelId: "chichiri",
        reason: "My practical attachment ends late and Poly Alley is far from the workshop shuttle.",
        status: "pending",
        createdAt: iso(3 * DAY),
      },
    ],
    complaints,
    lostFound: [
      {
        id: "lf_1",
        kind: "found",
        title: "Casio scientific calculator",
        description: "Found on a bench outside the IT lab, initials engraved on the back cover.",
        location: "Main Campus · IT Lab",
        contact: "Ask at the porter's lodge",
        reporterName: "Yankho Chirwa",
        status: "open",
        createdAt: iso(7 * DAY),
      },
      {
        id: "lf_2",
        kind: "lost",
        title: "Student ID card (BIS/23/EP/061)",
        description: "Lost somewhere between the dining hall and Kapeni Hostel on Sunday evening.",
        location: "Kapeni Hostel",
        contact: "mary@mubas.ac.mw",
        reporterName: "Mary Kamanga",
        status: "open",
        createdAt: iso(2 * DAY),
      },
    ],
    inspections: [
      {
        id: "in_1",
        roomId: rooms.find((r) => r.number === "CH-02")!.id,
        inspectorId: "u_admin",
        condition: "fair",
        notes: "Mattress intact, desk stable, water stain appearing on the north ceiling corner — monitor for the next cycle.",
        photos: [svgPhoto("Room inspection · CH-02", "#0f3d30", "#e3a72f")],
        createdAt: iso(8 * DAY),
      },
      {
        id: "in_2",
        roomId: rooms.find((r) => r.number === "NY-03")!.id,
        inspectorId: "u_admin",
        condition: "good",
        notes: "Room in good order, all four beds accounted for, no damage recorded.",
        photos: [svgPhoto("Room inspection · NY-03", "#155a45", "#f7d089")],
        createdAt: iso(15 * DAY),
      },
    ],
    checkEvents: [
      {
        id: "ck_1",
        allocationId: "al_defton",
        type: "in",
        at: iso(9 * DAY),
        code: "c0de0001beef",
        byId: "u_guard",
      },
    ],
    counters: { receiptSeq: seq },
  };
}
