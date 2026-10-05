import SectionPage from "@/components/section-page";

export default function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <SectionPage params={params} searchParams={searchParams} kind="admin" />;
}
