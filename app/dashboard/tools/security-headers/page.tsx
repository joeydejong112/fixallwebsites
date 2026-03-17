import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SecurityHeadersClient } from "./SecurityHeadersClient";

export const metadata = {
  title: "Security Headers Generator — SiteFix",
  description: "Generate valid Nginx config for robust structural security headers.",
};

export default async function SecurityHeadersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <SecurityHeadersClient clerkId={userId} />;
}
