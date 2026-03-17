"use client";

import { ScoreRing } from "@/components/ScoreRing";
import { IssueCard } from "@/components/IssueCard";
import type { Doc } from "@/convex/_generated/dataModel";

type ScanResult = Doc<"scanResults">;
type Scan = Doc<"scans">;

const PILLARS = ["seo", "security", "performance", "accessibility", "technical", "mobile"];

const PILLAR_COLORS: Record<string, string> = {
  seo: "#a89dff",
  security: "#f87171",
  performance: "#f59e0b",
  accessibility: "#6ee7b7",
  technical: "#60a5fa",
  mobile: "#e879f9",
};

export function ShareableReport({ scan, results }: { scan: Scan; results: ScanResult[] }) {
  const pillarScores = scan.pillarScores as Record<string, number> | undefined;

  return (
    <div className="min-h-screen bg-[#0c0c14] font-['Outfit'] text-[#eeeaf8]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0c0c14]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-[18px] font-[800] tracking-[-0.02em]">
            site<span className="text-[#7c6aff]">fix</span>
          </span>
          <span className="text-[13px] text-white/40">Shared Report</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10 pb-24">
        {/* Hero */}
        <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] uppercase tracking-widest text-white/40 font-bold mb-2">Site Health Report</p>
            <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] mb-2 truncate" title={scan.url}>
              {scan.url}
            </h1>
            <p className="text-[14px] text-white/40">
              Scanned {new Date(scan.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="mt-4 text-[13px] text-white/30">
              Powered by <span className="text-[#a89dff]">SiteFix</span> — Website Health Scanner
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-center">
            <ScoreRing score={scan.overallScore ?? 0} size={130} />
            <span className="mt-3 text-[12px] uppercase tracking-widest text-white/40 font-bold">Overall Health</span>
          </div>
        </div>

        {/* Pillar Grid */}
        {pillarScores && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PILLARS.map((pillar) => {
              const score = pillarScores[pillar] ?? 0;
              const color = PILLAR_COLORS[pillar] ?? "#7c6aff";
              const scoreColor = score >= 80 ? "#6ee7b7" : score >= 60 ? "#f59e0b" : "#f87171";
              return (
                <div
                  key={pillar}
                  className="bg-[#131220] border border-white/5 rounded-[14px] p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color }}>
                    {pillar}
                  </span>
                  <span className="text-[28px] font-[800] tracking-[-0.04em]" style={{ color: scoreColor }}>
                    {score}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Issues */}
        <div className="space-y-4">
          <h2 className="text-xl font-[800] tracking-[-0.04em] text-[#eeeaf8] flex items-center gap-3">
            Issues Found
            <span className="bg-white/5 text-white/50 px-2.5 py-0.5 rounded-full text-xs font-mono">
              {results.length}
            </span>
          </h2>
          {results.length === 0 ? (
            <div className="text-center py-10 bg-[#131220] rounded-[14px] border border-white/5 text-white/40">
              No issues found.
            </div>
          ) : (
            results.map((result, idx) => (
              <IssueCard
                key={result._id}
                issue={result}
                isBlurred={false}
                onUpgradeClick={() => undefined}
                stepNumber={idx + 1}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
