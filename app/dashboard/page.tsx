import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 text-center">
        <p className="text-[#eeeaf8]/55">Skeleton dashboard loaded.</p>
      </div>
    </div>
  );
}
