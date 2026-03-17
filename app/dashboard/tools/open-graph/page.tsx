import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OpenGraphClient } from "./OpenGraphClient";

export const metadata = {
  title: "Open Graph Builder — SiteFix",
  description: "Live preview and generate Open Graph meta tags for social sharing.",
};

export default async function OpenGraphPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <OpenGraphClient clerkId={userId} />;
}
