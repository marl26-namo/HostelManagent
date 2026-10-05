import { getSessionUser } from "@/lib/auth";
import { AuthGate } from "@/components/auth-gate";
import { Sidebar, type NavItem } from "@/components/nav";

// Order matters: the first five entries become the mobile bottom tab bar.
const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
  { href: "/dashboard/room", label: "My room & bed", icon: "bed" },
  { href: "/dashboard/checkin", label: "Check-in", icon: "scan" },
  { href: "/dashboard/payments", label: "Payments", icon: "wallet" },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: "wrench" },
  { href: "/dashboard/booking", label: "Book a room", icon: "key" },
  { href: "/dashboard/transfers", label: "Room transfer", icon: "swap" },
  { href: "/dashboard/complaints", label: "Noise complaints", icon: "bell" },
  { href: "/dashboard/lost-found", label: "Lost & found", icon: "box" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "overview", exact: true },
  { href: "/admin/students", label: "Students", icon: "users" },
  { href: "/admin/applications", label: "Applications", icon: "list" },
  { href: "/admin/rooms", label: "Rooms & occupancy", icon: "rooms" },
  { href: "/admin/checkins", label: "Gate console", icon: "scan" },
  { href: "/admin/inspections", label: "Inspections", icon: "camera" },
  { href: "/admin/maintenance", label: "Maintenance", icon: "wrench" },
  { href: "/admin/transfers", label: "Transfers", icon: "swap" },
  { href: "/admin/complaints", label: "Noise complaints", icon: "bell" },
  { href: "/admin/lost-found", label: "Lost & found", icon: "box" },
  { href: "/admin/payments", label: "Payments", icon: "wallet" },
];

const GUARD_NAV: NavItem[] = [
  { href: "/guard", label: "Gate console", icon: "scan", exact: true },
];

const WORKSPACE: Record<string, string> = {
  student: "Student portal",
  admin: "Administration",
  security: "Gate security",
};

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  admin: "Hostel administrator",
  security: "Gate security",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) return <AuthGate />;

  const items =
    user.role === "admin" ? ADMIN_NAV : user.role === "security" ? GUARD_NAV : STUDENT_NAV;

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar
        items={items}
        workspace={WORKSPACE[user.role] ?? "Portal"}
        user={{
          name: user.name,
          roleLabel: ROLE_LABEL[user.role] ?? user.role,
          email: user.email,
        }}
      />
      <main className="min-w-0 flex-1 bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
