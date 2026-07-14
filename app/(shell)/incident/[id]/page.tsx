import { redirect } from "next/navigation";

export default async function IncidentIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dataset?: string }>;
}) {
  const { id } = await params;
  const { dataset } = await searchParams;
  const suffix = dataset === "upload" ? "?dataset=upload" : "";
  redirect(`/incident/${id}/diagnosis${suffix}`);
}
