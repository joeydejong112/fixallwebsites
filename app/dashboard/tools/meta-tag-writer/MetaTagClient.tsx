"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Sparkles, Lock, Loader2, Copy, CheckCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 155;

function charColor(len: number, min: number, max: number): string {
  if (len === 0) return "rgba(238,234,248,0.3)";
  if (len < min) return "#f59e0b";
  if (len > max) return "#f87171";
  return "#6ee7b7";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[12px] font-['Outfit'] transition-colors"
    >
      {copied ? <CheckCheck size={12} className="text-[#6ee7b7]" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function MetaTagClient({ clerkId }: { clerkId: string }) {
  const user = useQuery(api.users.getByClerkId, { clerkId });
  const generateMetaTags = useAction(api.aiTools.generateMetaTags);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFree = user?.plan === "free";
  const isLocked = isFree;

  const handleGenerate = async () => {
    if (!url || isLocked) return;
    setIsLoading(true);
    setError(null);
    try {
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
      const result = await generateMetaTags({
        url: normalizedUrl,
        clerkId,
        plan: user?.plan ?? "free",
      });
      setTitle(result.title);
      setDesc(result.description);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes("AI_LIMIT_REACHED")) {
        window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "blurred-issue" } }));
        setError("You have reached your AI usage limit for this month.");
      } else {
        setError(error.message || "Generation failed");
        toast.error(error.message || "Generation failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user === undefined) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-[#7c6aff]" size={32} /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2 flex items-center gap-3">
          <Sparkles size={24} className="text-[#a89dff]" />
          Meta Tag Writer
        </h1>
        <p className="text-[15px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
          AI-powered SEO title and meta description generator.
          {isLocked && <span className="ml-2 text-[#f59e0b]">Requires a paid plan.</span>}
        </p>
      </div>

      {/* Input */}
      <div className={cn(
        "bg-[#131220] border border-white/5 rounded-[20px] p-6 sm:p-8 space-y-4 relative transition-all",
        isLocked && "opacity-60 pointer-events-none"
      )}>
        {isLocked && (
          <div className="absolute inset-0 rounded-[20px] backdrop-blur-[2px] flex items-center justify-center z-10">
            <div
              onClick={() => window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "blurred-issue" } }))}
              className="flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-[rgba(124,106,255,0.15)] border border-[rgba(124,106,255,0.3)] flex items-center justify-center">
                <Lock size={22} className="text-[#a89dff]" />
              </div>
              <p className="font-['Outfit'] font-[700] text-[#eeeaf8] text-[16px]">Starter or Pro required</p>
              <p className="font-['Outfit'] text-white/50 text-[14px]">Click to upgrade</p>
            </div>
          </div>
        )}

        <div>
          <label className="block font-['Outfit'] text-[13px] font-[600] text-white/60 uppercase tracking-widest mb-2">
            Website URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="https://example.com"
              className="flex-1 bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-3 font-['Outfit'] text-[14px] text-[#eeeaf8] placeholder:text-white/30 outline-none focus:border-[rgba(124,106,255,0.4)] transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={!url || isLoading}
              className="px-5 py-3 bg-[#7c6aff] hover:bg-[#6a58e8] disabled:opacity-50 rounded-[10px] font-['Outfit'] font-[600] text-[14px] text-white flex items-center gap-2 whitespace-nowrap transition-colors"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)] rounded-[12px] text-[#f87171] font-['Outfit'] text-[14px]">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Results */}
      {(title || desc) && (
        <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 sm:p-8 space-y-6">
          {/* Title field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-['Outfit'] text-[13px] font-[600] text-white/60 uppercase tracking-widest">
                Meta Title
              </label>
              <div className="flex items-center gap-3">
                <span className="font-['JetBrains Mono', monospace] text-[12px]" style={{ color: charColor(title.length, TITLE_MIN, TITLE_MAX) }}>
                  {title.length}/{TITLE_MAX}
                </span>
                <CopyButton text={title} />
              </div>
            </div>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-3 font-['Outfit'] text-[14px] text-[#eeeaf8] outline-none focus:border-[rgba(124,106,255,0.4)] transition-colors resize-none"
            />
            <div className="h-1 rounded-full bg-white/5 mt-2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((title.length / TITLE_MAX) * 100, 100)}%`,
                  backgroundColor: charColor(title.length, TITLE_MIN, TITLE_MAX),
                }}
              />
            </div>
          </div>

          {/* Description field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-['Outfit'] text-[13px] font-[600] text-white/60 uppercase tracking-widest">
                Meta Description
              </label>
              <div className="flex items-center gap-3">
                <span className="font-['JetBrains Mono', monospace] text-[12px]" style={{ color: charColor(desc.length, DESC_MIN, DESC_MAX) }}>
                  {desc.length}/{DESC_MAX}
                </span>
                <CopyButton text={desc} />
              </div>
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-3 font-['Outfit'] text-[14px] text-[#eeeaf8] outline-none focus:border-[rgba(124,106,255,0.4)] transition-colors resize-none"
            />
            <div className="h-1 rounded-full bg-white/5 mt-2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((desc.length / DESC_MAX) * 100, 100)}%`,
                  backgroundColor: charColor(desc.length, DESC_MIN, DESC_MAX),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
