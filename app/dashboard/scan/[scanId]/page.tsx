import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ScanResultsClient } from "./ScanResultsClient";
import { Id } from "@/convex/_generated/dataModel";

export default async function ScanResultsPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { scanId } = await params;

  return <ScanResultsClient scanId={scanId as Id<"scans">} clerkId={userId} />;
}
