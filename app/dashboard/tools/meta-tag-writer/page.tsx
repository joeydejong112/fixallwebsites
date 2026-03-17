import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MetaTagClient } from "./MetaTagClient";

export const metadata = {
  title: "Meta Tag Writer — SiteFix",
  description: "AI-powered SEO title and meta description generator",
};

export default async function MetaTagWriterPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <MetaTagClient clerkId={userId} />;
}
