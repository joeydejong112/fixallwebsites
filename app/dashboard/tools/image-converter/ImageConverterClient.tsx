"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRef, useState, useCallback } from "react";
import { Upload, X, Download, Archive, Loader2, ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConvertedFile {
  name: string;
  webpBase64: string;
  originalSize: number;
  newSize: number;
}

interface FileError {
  name: string;
  error: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function savingsPercent(original: number, converted: number): number {
  return Math.round(((original - converted) / original) * 100);
}

export function ImageConverterClient({ clerkId }: { clerkId: string }) {
  const user = useQuery(api.users.getByClerkId, { clerkId });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [fileErrors, setFileErrors] = useState<FileError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFree = user?.plan === "free";

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const MAX_MB = 10;
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: Not an image file`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`${file.name}: Exceeds ${MAX_MB}MB limit`);
        continue;
      }
      valid.push(file);
    }
    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (name: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) return;

    if (isFree && selectedFiles.length > 5) {
      window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "export-pdf" } }));
      toast.error("Free plan allows up to 5 files per batch. Upgrade for more.");
      return;
    }

    setIsConverting(true);
    setConvertedFiles([]);
    setFileErrors([]);

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/tools/convert", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { results: ConvertedFile[]; errors: FileError[] };

      if (!res.ok) {
        // Batch limit or other plan error
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent("showUpgradeModal", { detail: { trigger: "export-pdf" } }));
        }
        toast.error(data.errors?.[0]?.error ?? "Conversion failed");
        return;
      }

      setConvertedFiles(data.results);
      setFileErrors(data.errors);

      if (data.results.length > 0) {
        toast.success(`${data.results.length} file(s) converted successfully!`);
      }
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} file(s) failed — check results below.`);
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadSingle = (file: ConvertedFile) => {
    const a = document.createElement("a");
    a.href = `data:image/webp;base64,${file.webpBase64}`;
    a.download = file.name;
    a.click();
  };

  const downloadAllAsZip = async () => {
    if (convertedFiles.length === 0) return;
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const file of convertedFiles) {
      const binary = atob(file.webpBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      zip.file(file.name, bytes);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitefix-converted.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2">
          Image Converter
        </h1>
        <p className="text-[15px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
          Convert JPG, PNG, AVIF, and GIF images to optimized WebP format.
          {isFree && (
            <span className="ml-2 text-[#f59e0b]">Free plan: up to 5 files per batch.</span>
          )}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center min-h-[220px] rounded-[20px] border-2 border-dashed cursor-pointer transition-all duration-200",
          isDragging
            ? "border-[#7c6aff] bg-[rgba(124,106,255,0.08)]"
            : "border-white/10 bg-[#131220] hover:border-[rgba(124,106,255,0.4)] hover:bg-[rgba(124,106,255,0.04)]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors",
          isDragging ? "bg-[rgba(124,106,255,0.2)]" : "bg-white/5"
        )}>
          <Upload size={24} className={isDragging ? "text-[#a89dff]" : "text-white/40"} />
        </div>
        <p className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[16px] mb-1">
          {isDragging ? "Drop images here" : "Click or drag images here"}
        </p>
        <p className="font-['Outfit'] text-[13px] text-white/40">
          JPG, PNG, AVIF, GIF — max 10MB per file
        </p>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="bg-[#131220] border border-white/5 rounded-[20px] p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Outfit'] font-[700] text-[#eeeaf8] text-[15px]">
              {selectedFiles.length} file(s) selected
            </h3>
            <button
              onClick={handleConvert}
              disabled={isConverting || selectedFiles.length === 0}
              className="bg-[#7c6aff] hover:bg-[#6a58e8] disabled:opacity-50 text-white px-5 py-2 rounded-[8px] font-['Outfit'] font-[600] text-[14px] flex items-center gap-2 transition-colors"
            >
              {isConverting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isConverting ? "Converting…" : "Convert to WebP"}
            </button>
          </div>
          {selectedFiles.map((file) => (
            <div key={file.name} className="flex items-center gap-3 p-3 bg-[#0e0d1c] rounded-[10px]">
              <ImageIcon size={16} className="text-white/30 shrink-0" />
              <span className="font-['Outfit'] text-[14px] text-white/80 flex-1 truncate">{file.name}</span>
              <span className="font-['Outfit'] text-[13px] text-white/40 shrink-0">{formatBytes(file.size)}</span>
              <button onClick={() => removeFile(file.name)} className="text-white/30 hover:text-white/70 shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {(convertedFiles.length > 0 || fileErrors.length > 0) && (
        <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Outfit'] font-[700] text-[#eeeaf8] text-[16px]">Converted Files</h3>
            {convertedFiles.length > 1 && (
              <button
                onClick={downloadAllAsZip}
                className="flex items-center gap-2 px-4 py-2 bg-[rgba(110,231,183,0.08)] hover:bg-[rgba(110,231,183,0.12)] border border-[rgba(110,231,183,0.15)] text-[#6ee7b7] rounded-[8px] font-['Outfit'] text-[13px] font-[600] transition-colors"
              >
                <Archive size={14} />
                Download all as ZIP
              </button>
            )}
          </div>

          {convertedFiles.map((file) => {
            const savings = savingsPercent(file.originalSize, file.newSize);
            return (
              <div key={file.name} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-[#0e0d1c] rounded-[12px] border border-[rgba(110,231,183,0.08)]">
                <CheckCircle2 size={16} className="text-[#6ee7b7] shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-['Outfit'] font-[600] text-[14px] text-[#eeeaf8] truncate">{file.name}</p>
                  <p className="font-['Outfit'] text-[12px] text-white/40">
                    {formatBytes(file.originalSize)} → {formatBytes(file.newSize)}
                    {savings > 0 && (
                      <span className="ml-2 text-[#6ee7b7] font-bold">−{savings}%</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => downloadSingle(file)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(124,106,255,0.1)] hover:bg-[rgba(124,106,255,0.15)] border border-[rgba(124,106,255,0.2)] text-[#a89dff] rounded-[8px] font-['Outfit'] text-[13px] transition-colors shrink-0"
                >
                  <Download size={13} />
                  Download
                </button>
              </div>
            );
          })}

          {fileErrors.map((e) => (
            <div key={e.name} className="flex items-start gap-3 p-4 bg-[rgba(248,113,113,0.05)] rounded-[12px] border border-[rgba(248,113,113,0.1)]">
              <AlertCircle size={16} className="text-[#f87171] shrink-0 mt-0.5" />
              <div>
                <p className="font-['Outfit'] font-[600] text-[14px] text-[#eeeaf8]">{e.name}</p>
                <p className="font-['Outfit'] text-[13px] text-[#f87171]">{e.error}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
