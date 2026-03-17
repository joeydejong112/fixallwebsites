import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { MinifierClient } from "./MinifierClient";

export const metadata = {
  title: "Code Minifier | SiteFix",
  description: "Minify your CSS and JavaScript files.",
};

export default async function MinifierPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return <MinifierClient clerkId={user.id} />;
}
