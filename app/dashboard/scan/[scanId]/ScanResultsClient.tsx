"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ScoreRing } from "@/components/ScoreRing";
import { PillarCard } from "@/components/PillarCard";
import { IssueCard } from "@/components/IssueCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ScanResultsClient({ scanId, clerkId }: { scanId: Id<"scans">; clerkId: string }) {
  const router = useRouter();
  const [activePillar, setActivePillar] = useState<string | null>(null);

  const data = useQuery(api.scanQueries.getScanResults, { scanId });
  const user = useQuery(api.users.getByClerkId, { clerkId });

  if (data === undefined || user === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#7c6aff]" size={32} />
      </div>
    );
  }

  if (data === null || !data.scan || user === null) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4 font-['Outfit']">Scan not found</h2>
        <button onClick={() => router.push("/dashboard")} className="text-[#a89dff] hover:text-white font-['Outfit']">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { scan, results } = data;
  const isPro = user.plan === "pro";
  const isStarter = user.plan === "starter";
  const isFree = user.plan === "free";
  
  // Free users only see top 5 issues fully, rest are blurred.
  const limitVisible = isFree ? 5 : results.length;

  const handleUpgradeClick = () => {
    window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "blurred-issue" } }));
  };

  const filteredResults = activePillar 
    ? results.filter(r => r.pillar.toLowerCase() === activePillar.toLowerCase())
    : results;

  // sort results: high impact first, then medium, then low
  const sortedResults = [...filteredResults].sort((a, b) => {
    const scoreMap = { high: 3, medium: 2, low: 1 };
    const aS = scoreMap[a.impact] || 0;
    const bS = scoreMap[b.impact] || 0;
    if (aS !== bS) return bS - aS;
    if (a.status === "fail" && b.status !== "fail") return -1;
    if (a.status !== "fail" && b.status === "fail") return 1;
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 fade-in animate-in duration-500">
      <button 
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-['Outfit']"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Hero Header */}
      <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[rgba(124,106,255,0.03)] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col items-center md:items-start text-center md:text-left z-10 w-full md:w-auto overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2 truncate w-full sm:max-w-lg" title={scan.url}>
            {scan.url}
          </h1>
          <p className="text-[rgba(238,234,248,0.38)] font-['Outfit'] text-[14px]">
            Scanned on {new Date(scan.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
          </p>

          {scan.status === "scanning" && (
            <div className="mt-6 flex items-center gap-2 text-[#a89dff] bg-[rgba(124,106,255,0.1)] px-4 py-2 rounded-full font-['Outfit'] text-sm">
              <Loader2 size={16} className="animate-spin" />
              Scanning in progress...
            </div>
          )}
          {scan.status === "queued" && (
            <div className="mt-6 flex items-center gap-2 text-white/50 bg-white/5 px-4 py-2 rounded-full font-['Outfit'] text-sm">
              <Loader2 size={16} className="animate-spin" />
              Scan queued...
            </div>
          )}
          {scan.status === "error" && (
            <div className="mt-6 text-[#f87171] bg-[rgba(248,113,113,0.08)] px-4 py-2 rounded-lg border border-[rgba(248,113,113,0.2)]">
              Scan failed: {scan.errorMessage}
            </div>
          )}
        </div>

        {scan.status === "complete" && scan.overallScore !== undefined && (
          <div className="shrink-0 z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <ScoreRing score={scan.overallScore} size={140} />
            <span className="mt-4 font-['Outfit'] font-[500] text-[13px] tracking-wide uppercase text-white/40">
              Overall Health
            </span>
          </div>
        )}
      </div>

      {scan.status === "complete" && scan.pillarScores && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {(["seo", "security", "performance", "accessibility", "technical", "mobile"]).map((pillar, idx) => {
              const score = scan.pillarScores[pillar] ?? 0;
              return (
                <PillarCard 
                  key={pillar}
                  pillar={pillar}
                  score={score}
                  active={activePillar === pillar}
                  onClick={() => setActivePillar(activePillar === pillar ? null : pillar)}
                  animationDelay={idx * 0.1}
                />
              );
            })}
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] flex items-center gap-3">
                {activePillar ? `${activePillar.charAt(0).toUpperCase() + activePillar.slice(1)} Issues` : "All Issues"}
                <span className="bg-[rgba(255,255,255,0.05)] text-white/50 px-2.5 py-0.5 rounded-full text-xs font-mono">
                  {filteredResults.length}
                </span>
              </h2>
            </div>
            
            <div className="space-y-4">
              {sortedResults.length === 0 ? (
                <div className="text-center py-10 bg-[#131220] rounded-[14px] border border-white/5">
                  <p className="text-white/40 font-['Outfit']">No issues found for this pillar.</p>
                </div>
              ) : (
                sortedResults.map((result, idx) => (
                  <IssueCard 
                    key={result._id || idx}
                    issue={result}
                    isBlurred={idx >= limitVisible}
                    onUpgradeClick={handleUpgradeClick}
                    stepNumber={idx + 1}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
