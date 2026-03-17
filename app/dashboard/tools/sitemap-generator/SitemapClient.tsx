"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Copy, Download, Loader2, Play, Search, AlertCircle, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SitemapClient({ clerkId }: { clerkId: string }) {
  const [url, setUrl] = useState("");
  const [activeJobId, setActiveJobId] = useState<Id<"sitemapJobs"> | null>(null);

  const user = useQuery(api.users.getByClerkId, { clerkId });
  const startJob = useMutation(api.sitemap.startSitemapJob);
  const job = useQuery(
    api.sitemap.getSitemapJob,
    activeJobId ? { jobId: activeJobId } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    if (user.plan === "free") {
      window.dispatchEvent(
        new CustomEvent("showUpgradeModal", { detail: { trigger: "sitemap" } })
      );
      return;
    }

    try {
      const id = await startJob({ url });
      setActiveJobId(id);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to start sitemap generator");
    }
  };

  const generateSitemapXml = (urls: string[]) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const link of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${link}</loc>\n`;
      xml += '  </url>\n';
    }
    xml += '</urlset>';
    return xml;
  };

  const downloadFile = (content: string) => {
    const blob = new Blob([content], { type: "application/xml" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const isPro = user?.plan === "pro";
  const isStarter = user?.plan === "starter";
  const isLocked = !isStarter && !isPro;

  return (
    <div className="space-y-6 fade-in animate-in duration-500">
      <div>
        <h1 className="text-2xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2">
          XML Sitemap Generator
        </h1>
        <p className="text-[rgba(238,234,248,0.38)] font-['Outfit'] text-[15px]">
          Crawl any website to auto-generate a complete XML Sitemap ready for Google Search Console. 
        </p>
      </div>

      <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/20" />
            </div>
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={job?.status === "running"}
              className="w-full h-[52px] pl-11 pr-4 rounded-[12px] bg-[#0e0d1c] border border-[rgba(255,255,255,0.07)] focus:border-[rgba(124,106,255,0.45)] focus:ring-[3px] focus:ring-[rgba(124,106,255,0.15)] text-[#eeeaf8] font-['Outfit'] outline-none transition-all placeholder:text-[rgba(238,234,248,0.3)] disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!url || job?.status === "running"}
            className="h-[52px] px-8 rounded-[12px] bg-[#7c6aff] hover:bg-[#8e7fff] disabled:hover:bg-[#7c6aff] disabled:opacity-50 text-white font-['Outfit'] font-[500] transition-colors flex items-center justify-center gap-2"
          >
            {job?.status === "running" ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Crawling...
              </>
            ) : (
              <>
                <Play size={18} /> Start Generating
              </>
            )}
          </button>
        </form>

        {isLocked && (
          <div className="mt-4 p-4 rounded-[12px] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[#f59e0b] font-['Outfit'] font-[500] text-[15px]">
                Upgrade Required
              </h4>
              <p className="text-[rgba(238,234,248,0.55)] font-['Outfit'] text-[14px] leading-relaxed">
                The XML Sitemap Generator requires a Starter or Pro plan. Upgrade to unlock bulk crawling and instant XML file generation.
              </p>
            </div>
          </div>
        )}
      </div>

      {job && (
        <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-6">
            <div>
              <h2 className="text-xl font-[700] tracking-tight text-[#eeeaf8] font-['Outfit'] flex items-center gap-2">
                <FileCode2 size={24} className="text-[#a89dff]" /> Crawl Results
              </h2>
            </div>
            
            {job.status === "complete" && (
               <button
                 onClick={() => downloadFile(generateSitemapXml(job.urls || []))}
                 className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[rgba(124,106,255,0.1)] hover:bg-[rgba(124,106,255,0.15)] border border-[rgba(124,106,255,0.2)] text-[#a89dff] font-['Outfit'] text-[14px] font-[500] transition-colors"
               >
                 <Download size={16} /> Download XML
               </button>
            )}
          </div>

          {job.status === "running" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="w-10 h-10 text-[#7c6aff] animate-spin" />
              <div className="text-center font-['Outfit']">
                <p className="text-[#eeeaf8] font-[500]">Crawling {job.url}</p>
                <p className="text-[rgba(238,234,248,0.55)] text-[14px]">Found {job.pagesFound || 0} pages so far...</p>
              </div>
            </div>
          )}

          {job.status === "complete" && (
            <div className="space-y-4">
               <div className="bg-[#0e0d1c] p-6 rounded-[12px] border border-[rgba(255,255,255,0.05)] font-mono text-[13px] text-[rgba(238,234,248,0.7)] h-[400px] overflow-auto whitespace-pre">
                 {generateSitemapXml(job.urls || [])}
               </div>
            </div>
          )}

          {job.status === "error" && (
            <div className="p-4 rounded-[12px] bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#f87171] font-['Outfit'] text-[14px]">
              An internal error occurred while generating your sitemap. Please check the URL and try again.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
