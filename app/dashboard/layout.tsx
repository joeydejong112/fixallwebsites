import { UserButton } from "@clerk/nextjs";
import { UpgradeModalProvider } from "@/components/UpgradeModalProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-[var(--navbar-height)] flex items-center justify-between px-6 border-b border-white/5 bg-[#0c0c14] sticky top-0 z-50">
        <div className="font-[800] text-xl tracking-tight font-['Outfit']">
          <a href="/dashboard">
            <span className="text-[#eeeaf8]">site</span><span className="text-[#7c6aff]">fix</span>
          </a>
        </div>
        <UserButton />
      </header>
      <main className="flex-1 overflow-auto bg-[#0c0c14] p-6">
        <UpgradeModalProvider>
          {children}
        </UpgradeModalProvider>
      </main>
    </div>
  );
}
