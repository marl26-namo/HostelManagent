import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { CheckinsSection } from "@/components/sections/checkins";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Gate console" };

export default async function GuardPage() {
  const user = await requireRole(["admin", "security"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate console"
        subtitle={`Scan student key cards to record arrivals and departures. Signed in as ${user.name} · gate security.`}
      />
      <CheckinsSection />
    </div>
  );
}
