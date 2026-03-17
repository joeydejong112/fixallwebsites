"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Copy, FileCode2, Loader2, Play, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function MinifierClient({ clerkId }: { clerkId: string }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"css" | "js">("css");
  const [minified, setMinified] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<{ orig: number; new: number } | null>(null);

  const user = useQuery(api.users.getByClerkId, { clerkId });

  const handleMinify = async () => {
    if (!code.trim() || !user) return;

    if (user.plan === "free") {
      window.dispatchEvent(
        new CustomEvent("showUpgradeModal", { detail: { trigger: "minifier" } })
      );
      return;
    }

    setIsProcessing(true);
    setStats(null);
    setMinified("");

    try {
      const res = await fetch("/api/tools/minify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Minification failed");

      setMinified(data.minifiedCode);
      setStats({ orig: data.originalSize, new: data.newSize });
      toast.success(`${type.toUpperCase()} minified successfully!`);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!minified) return;
    try {
      await navigator.clipboard.writeText(minified);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const getSavings = () => {
    if (!stats) return "0";
    const percent = ((stats.orig - stats.new) / stats.orig) * 100;
    return percent.toFixed(1);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isLocked = user?.plan === "free";

  return (
    <div className="space-y-6 fade-in animate-in duration-500">
      <div>
        <h1 className="text-2xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2">
          Code Minifier
        </h1>
        <p className="text-[rgba(238,234,248,0.38)] font-['Outfit'] text-[15px]">
          Compress and optimize your raw CSS stylesheets or JavaScript code for production.
        </p>
      </div>

      <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-6 space-y-6">
        {isLocked && (
          <div className="p-4 rounded-[12px] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[#f59e0b] font-['Outfit'] font-[500] text-[15px]">
                Upgrade Required
              </h4>
              <p className="text-[rgba(238,234,248,0.55)] font-['Outfit'] text-[14px] leading-relaxed">
                The code minifier requires a Starter or Pro plan. Upgrade to compress unlimited UI stylesheets & scripts.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-[#0e0d1c] p-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
                <button
                  type="button"
                  onClick={() => setType("css")}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[13px] font-['Outfit'] font-medium transition-colors",
                    type === "css" ? "bg-[rgba(124,106,255,0.1)] text-[#a89dff]" : "text-white/40 hover:text-white/70"
                  )}
                >
                  CSS
                </button>
                <button
                  type="button"
                  onClick={() => setType("js")}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[13px] font-['Outfit'] font-medium transition-colors",
                    type === "js" ? "bg-[rgba(124,106,255,0.1)] text-[#a89dff]" : "text-white/40 hover:text-white/70"
                  )}
                >
                  JavaScript
                </button>
              </div>
              
              <button
                onClick={handleMinify}
                disabled={!code || isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#7c6aff] hover:bg-[#8e7fff] disabled:opacity-50 text-white font-['Outfit'] text-[13px] font-[500] transition-colors"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Minify Code
              </button>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Paste your raw unminified ${type.toUpperCase()} code here...`}
              className="w-full h-[400px] p-4 bg-[#0e0d1c] border border-[rgba(255,255,255,0.05)] rounded-[12px] text-[rgba(238,234,248,0.7)] font-mono text-[13px] resize-none focus:outline-none focus:border-[rgba(124,106,255,0.3)] transition-colors"
              spellCheck={false}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between h-[36px]">
              <span className="font-['Outfit'] text-[#eeeaf8] text-[15px] font-[500]">Output</span>
              {stats && (
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-['Outfit'] text-white/40">
                    <span className="line-through">{formatBytes(stats.orig)}</span> → <span className="text-[#6ee7b7]">{formatBytes(stats.new)}</span>
                  </span>
                  <span className="bg-[rgba(110,231,183,0.1)] text-[#6ee7b7] px-2 py-0.5 rounded-full text-[11px] font-['Outfit'] font-bold uppercase tracking-wider">
                    {getSavings()}% saved
                  </span>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea
                value={minified}
                readOnly
                placeholder={`Minified ${type.toUpperCase()} output will appear here...`}
                className="w-full h-[400px] p-4 bg-[#0e0d1c] border border-[rgba(255,255,255,0.05)] rounded-[12px] text-[rgba(238,234,248,0.7)] font-mono text-[13px] resize-none focus:outline-none"
                spellCheck={false}
              />
              {minified && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 p-2 bg-[#16152a] hover:bg-[#1f1d38] border border-white/5 rounded-md text-white/50 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
