"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowRight, Activity, Clock, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardClient({ clerkId }: { clerkId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const scans = useQuery(api.scanQueries.getUserScans, { userId: clerkId });
  const createScan = useMutation(api.scanMutations.createScan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      const scanId = await createScan({ url });
      router.push(`/dashboard/scan/${scanId}`);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message && error.message.includes("Plan limit reached")) {
        window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "scan-limit" } }));
      } else {
        setError(error.message || "Failed to start scan");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero New Scan Card */}
      <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-8 sm:p-12 relative overflow-hidden">
        {/* decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-[rgba(124,106,255,0.05)] blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit']">
              Run a new website scan
            </h1>
            <p className="text-[16px] text-[rgba(238,234,248,0.55)] font-['Outfit'] max-w-lg mx-auto">
              Analyze your site for SEO, security, performance, accessibility, and technical issues.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-xl relative flex items-center">
            <div className="absolute left-4 text-white/40">
              <Search size={20} />
            </div>
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full h-[56px] pl-12 pr-[140px] rounded-[12px] bg-[#0e0d1c] border border-[rgba(255,255,255,0.07)] focus:border-[rgba(124,106,255,0.45)] focus:ring-[3px] focus:ring-[rgba(124,106,255,0.15)] text-[#eeeaf8] font-['Outfit'] text-[16px] outline-none transition-all placeholder:text-[rgba(238,234,248,0.3)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting || !url}
              className="absolute right-2 h-[40px] px-6 rounded-[8px] bg-[#7c6aff] hover:bg-[#8e7fff] text-white font-['Outfit'] font-medium text-[15px] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Scanning..." : "Start scan"}
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {error && (
            <div className="text-[#f87171] bg-[rgba(248,113,113,0.08)] px-4 py-2 rounded-[8px] border border-[rgba(248,113,113,0.2)] font-['Outfit'] text-[14px]">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* History section */}
      <div className="space-y-4">
        <h2 className="text-xl font-[700] tracking-[-0.02em] text-[#eeeaf8] font-['Outfit']">
          Recent Scans
        </h2>
        
        {scans === undefined ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] rounded-[14px] bg-[#131220] border border-[rgba(255,255,255,0.05)] animate-pulse" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[14px] p-8 text-center text-[rgba(238,234,248,0.38)] font-['Outfit'] border-dashed">
            You haven't scanned any websites yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {scans.map((scan) => (
              <button
                key={scan._id}
                onClick={() => router.push(`/dashboard/scan/${scan._id}`)}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[rgba(19,18,32,0.5)] border border-[rgba(255,255,255,0.05)] hover:bg-[#16152a] hover:border-[rgba(255,255,255,0.1)] rounded-[14px] transition-all text-left w-full outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    scan.status === "complete" ? "bg-[rgba(110,231,183,0.08)] text-[#6ee7b7]" :
                    scan.status === "error" ? "bg-[rgba(248,113,113,0.08)] text-[#f87171]" :
                    "bg-[rgba(124,106,255,0.1)] text-[#a89dff]"
                  )}>
                    {scan.status === "complete" ? <CheckCircle2 size={18} /> : 
                     scan.status === "error" ? <AlertCircle size={18} /> : 
                     <Activity size={18} className="animate-spin-slow" />}
                  </div>
                  <div>
                    <h3 className="font-['Outfit'] font-[600] text-[15px] text-[#eeeaf8] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                      {scan.url}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-[rgba(238,234,248,0.38)]" />
                      <span className="font-['Outfit'] font-[400] text-[12px] text-[rgba(238,234,248,0.38)]">
                        {new Date(scan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center gap-4">
                  {scan.status === "complete" && scan.overallScore !== undefined && (
                    <div className="flex items-center gap-2">
                       <span className={cn(
                        "rounded-[999px] font-['Outfit'] font-[600] text-[11px] tracking-[0.02em] px-[12px] py-[4px] border",
                        scan.overallScore >= 80 ? "bg-[rgba(110,231,183,0.08)] border-[rgba(110,231,183,0.2)] text-[#6ee7b7]" :
                        scan.overallScore >= 60 ? "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.2)] text-[#f59e0b]" :
                        "bg-[rgba(248,113,113,0.08)] border-[rgba(248,113,113,0.2)] text-[#f87171]"
                      )}>
                        {scan.overallScore}/100
                      </span>
                    </div>
                  )}
                  {scan.status === "scanning" && (
                    <span className="font-['Outfit'] font-[500] text-[13px] text-[#eeeaf8] animate-pulse">
                      Scanning...
                    </span>
                  )}
                  {scan.status === "error" && (
                     <span className="font-['Outfit'] font-[500] text-[13px] text-[#f87171]">
                      Scan Failed
                     </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
