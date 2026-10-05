import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const rawReturn = params.returnTo ?? "";
  const returnTo = rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/dashboard";
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return <AuthForm returnTo={returnTo} initialMode={initialMode} />;
}
