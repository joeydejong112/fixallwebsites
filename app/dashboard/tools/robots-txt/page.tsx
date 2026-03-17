import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RobotsTxtClient } from "./RobotsTxtClient";

export const metadata = {
  title: "Robots.txt Builder — SiteFix",
  description: "Configure and download a valid robots.txt file for your website.",
};

export default async function RobotsTxtPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <RobotsTxtClient clerkId={userId} />;
}
