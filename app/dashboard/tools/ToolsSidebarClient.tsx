"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ImageIcon, 
  Sparkles, 
  Type, 
  ShieldCheck, 
  FileText, 
  Share2,
  FileCode2,
  Minimize2,
  SplitSquareHorizontal,
  Lock,
  Loader2
} from "lucide-react";

const TOOLS = [
  {
    category: "Media & Content",
    items: [
      { name: "Image Converter", slug: "image-converter", icon: ImageIcon, plan: "free" },
      { name: "Alt Text Generator", slug: "alt-text-generator", icon: Type, plan: "starter" },
      { name: "Meta Tag Writer", slug: "meta-tag-writer", icon: Sparkles, plan: "starter" },
      { name: "Open Graph Builder", slug: "open-graph", icon: Share2, plan: "free" },
    ]
  },
  {
    category: "Technical SEO",
    items: [
      { name: "Robots.txt Builder", slug: "robots-txt", icon: FileText, plan: "free" },
      { name: "Sitemap Generator", slug: "sitemap-generator", icon: FileCode2, plan: "starter" },
      { name: "Security Headers", slug: "security-headers", icon: ShieldCheck, plan: "free" },
    ]
  },
  {
    category: "Performance",
    items: [
      { name: "Code Minifier", slug: "minifier", icon: Minimize2, plan: "starter" },
      { name: "Competitor Compare", slug: "competitor", icon: SplitSquareHorizontal, plan: "pro" },
    ]
  }
];

export function ToolsSidebarClient({ clerkId }: { clerkId: string }) {
  const pathname = usePathname();
  const user = useQuery(api.users.getByClerkId, { clerkId });

  if (user === undefined) {
    return (
      <aside className="w-full md:w-64 shrink-0">
        <div className="sticky top-[var(--navbar-height,80px)] space-y-8 bg-[#131220] border border-white/5 rounded-[20px] p-6 min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/20" />
        </div>
      </aside>
    );
  }

  const currentPlan = user?.plan || "free";
  
  const hasAccess = (requiredPlan: string) => {
    if (requiredPlan === "free") return true;
    if (requiredPlan === "starter") return currentPlan === "starter" || currentPlan === "pro";
    if (requiredPlan === "pro") return currentPlan === "pro";
    return false;
  };

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "tools" } }));
  };

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="sticky top-24 space-y-8 bg-[#131220] border border-white/5 rounded-[20px] p-6">
        {TOOLS.map((category) => (
          <div key={category.category}>
            <h3 className="font-['Outfit'] text-[12px] font-[600] text-white/40 uppercase tracking-wider mb-3 px-3">
              {category.category}
            </h3>
            <div className="space-y-1">
              {category.items.map((tool) => {
                const isActive = pathname.includes(`/dashboard/tools/${tool.slug}`);
                const isLocked = !hasAccess(tool.plan);
                const Icon = tool.icon;

                return (
                  <Link
                    key={tool.slug}
                    href={`/dashboard/tools/${tool.slug}`}
                    onClick={isLocked ? handleLockedClick : undefined}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-[10px] font-['Outfit'] text-[14px] transition-colors group",
                      isActive 
                        ? "bg-[#7c6aff] text-white font-[500]" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? "text-white" : "text-white/40 group-hover:text-white/70"} />
                      {tool.name}
                    </div>
                    
                    {isLocked && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[rgba(248,113,113,0.15)] text-[#f87171]">
                        <Lock size={10} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
