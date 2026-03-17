import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AltTextClient } from "./AltTextClient";

export const metadata = {
  title: "Alt Text Generator — SiteFix",
  description: "AI-powered accessibility alt text generator for images",
};

export default async function AltTextGeneratorPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <AltTextClient clerkId={userId} />;
}
