import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ToolsSidebarClient } from "./ToolsSidebarClient";

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-140px)]">
      <ToolsSidebarClient clerkId={userId} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
