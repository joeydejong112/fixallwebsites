"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useCallback, useRef } from "react";
import { ImageIcon, Upload, Loader2, Lock, Copy, CheckCheck, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export function AltTextClient({ clerkId }: { clerkId: string }) {
  const user = useQuery(api.users.getByClerkId, { clerkId });
  const generateAltText = useAction(api.aiTools.generateAltText);

  const [mode, setMode] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFree = user?.plan === "free";
  const isLocked = isFree;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (isLocked) return;
    setIsLoading(true);
    setError(null);
    setAltText("");

    try {
      let result: { altText: string };

      if (mode === "url") {
        if (!imageUrl) { toast.error("Enter an image URL"); return; }
        result = await generateAltText({
          imageUrl,
          clerkId,
          plan: user?.plan ?? "free",
        });
      } else {
        if (!uploadedFile) { toast.error("Upload an image first"); return; }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            resolve(dataUrl.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        result = await generateAltText({
          imageBase64: base64,
          mimeType: uploadedFile.type,
          clerkId,
          plan: user?.plan ?? "free",
        });
      }

      setAltText(result.altText);
    } catch (err: unknown) {
      const e = err as Error;
      if (e.message?.includes("AI_LIMIT_REACHED")) {
        window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "blurred-issue" } }));
        setError("You have reached your AI usage limit for this month.");
      } else {
        setError(e.message || "Generation failed");
        toast.error(e.message || "Generation failed");
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
          <ImageIcon size={24} className="text-[#a89dff]" />
          Alt Text Generator
        </h1>
        <p className="text-[15px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
          AI-generated accessibility alt text from any image.
          {isLocked && <span className="ml-2 text-[#f59e0b]">Requires a paid plan.</span>}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 bg-[#131220] border border-white/5 rounded-[12px] p-1 max-w-xs">
        {(["url", "upload"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 rounded-[8px] text-[13px] font-['Outfit'] font-[600] transition-colors",
              mode === m ? "bg-[#7c6aff] text-white" : "text-white/50 hover:text-white"
            )}
          >
            {m === "url" ? "Image URL" : "Upload Image"}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className={cn(
        "bg-[#131220] border border-white/5 rounded-[20px] p-6 sm:p-8 space-y-4 relative",
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

        {mode === "url" ? (
          <div>
            <label className="block font-['Outfit'] text-[13px] font-[600] text-white/60 uppercase tracking-widest mb-2">
              Image URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-3 font-['Outfit'] text-[14px] text-[#eeeaf8] placeholder:text-white/30 outline-none focus:border-[rgba(124,106,255,0.4)] transition-colors"
              />
              <button
                onClick={handleGenerate}
                disabled={!imageUrl || isLoading}
                className="px-5 py-3 bg-[#7c6aff] hover:bg-[#6a58e8] disabled:opacity-50 rounded-[10px] font-['Outfit'] font-[600] text-[14px] text-white flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                {isLoading ? "Analyzing…" : "Generate"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {uploadedPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedPreview} alt="Uploaded preview" className="w-full max-h-64 object-contain rounded-[12px] border border-white/5" />
                <button
                  onClick={() => { setUploadedFile(null); setUploadedPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-[rgba(0,0,0,0.6)] rounded-full flex items-center justify-center text-white/70 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[180px] rounded-[14px] border-2 border-dashed cursor-pointer transition-all",
                  isDragging ? "border-[#7c6aff] bg-[rgba(124,106,255,0.08)]" : "border-white/10 hover:border-[rgba(124,106,255,0.4)] bg-[#0e0d1c]"
                )}
              >
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Upload size={20} className={isDragging ? "text-[#a89dff]" : "text-white/30"} />
                <p className="mt-3 font-['Outfit'] text-[14px] text-white/60">Drop or click to upload</p>
                <p className="font-['Outfit'] text-[12px] text-white/30">Max 5MB</p>
              </div>
            )}

            {uploadedFile && (
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full mt-4 py-3 bg-[#7c6aff] hover:bg-[#6a58e8] disabled:opacity-50 rounded-[10px] font-['Outfit'] font-[600] text-[14px] text-white flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                {isLoading ? "Analyzing…" : "Generate Alt Text"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)] rounded-[12px] text-[#f87171] font-['Outfit'] text-[14px]">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Result */}
      {altText && (
        <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Outfit'] font-[700] text-[#eeeaf8] text-[15px]">Generated Alt Text</h3>
            <div className="flex items-center gap-2">
              <span className="font-['JetBrains Mono', monospace] text-[12px]" style={{ color: altText.length <= 125 ? "#6ee7b7" : "#f87171" }}>
                {altText.length}/125
              </span>
              <CopyButton text={altText} />
            </div>
          </div>
          <textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            rows={3}
            className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-3 font-['Outfit'] text-[14px] text-[#eeeaf8] outline-none focus:border-[rgba(124,106,255,0.4)] transition-colors resize-none"
          />
        </div>
      )}
    </div>
  );
}
