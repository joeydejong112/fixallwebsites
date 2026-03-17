import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { ShareableReport } from "./ShareableReport";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await fetchQuery(api.scanQueries.getScanByPublicToken, { token });
  if (!data) return { title: "Report Not Found — SiteFix" };
  return {
    title: `Site Health Report: ${data.scan.url} — SiteFix`,
    description: `Overall score: ${data.scan.overallScore ?? "N/A"}/100`,
  };
}

export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await fetchQuery(api.scanQueries.getScanByPublicToken, { token });

  if (!data || !data.scan) {
    notFound();
  }

  return <ShareableReport scan={data.scan} results={data.results} />;
}
