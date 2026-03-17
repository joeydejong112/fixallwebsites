"use client";

import { useEffect, useState } from "react";
import { X, Lock } from "lucide-react";

export function UpgradeModal({
  open,
  onClose,
  trigger,
}: {
  open: boolean;
  onClose: () => void;
  trigger: "scan-limit" | "blurred-issue" | "watch-site" | "export-pdf" | "competitor" | "chat" | "sitemap";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  if (!mounted || !open) return null;

  const getMessage = () => {
    switch (trigger) {
      case "scan-limit": return "You've reached your monthly scan limit.";
      case "blurred-issue": return "Upgrade to view all site issues and step-by-step fix guides.";
      case "watch-site": return "Upgrade to automatically monitor your site's health.";
      case "export-pdf": return "Upgrade to export professional PDF reports.";
      case "competitor": return "Upgrade to compare your site directly with competitors.";
      case "chat": return "Upgrade to ask our AI expert about your scan.";
      case "sitemap": return "Upgrade to generate and crawl full site maps.";
      default: return "Upgrade your plan to access this feature.";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.7)] p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[480px] rounded-[20px] border border-[rgba(124,106,255,0.25)] bg-[#16152a] p-[32px] shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-white/50 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(124,106,255,0.1)] text-[#a89dff]">
            <Lock size={32} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit']">
              Unlock SiteFix Pro
            </h2>
            <p className="text-[16px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
              {getMessage()}
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <a 
              href="/dashboard/settings"
              className="flex w-full items-center justify-center rounded-[8px] bg-[#7c6aff] px-4 py-3 text-[16px] font-medium text-white transition-opacity hover:opacity-90 font-['Outfit']"
            >
              View pricing plans
            </a>
            <button 
              onClick={onClose}
              className="w-full rounded-[8px] px-4 py-3 text-[16px] font-medium text-[rgba(238,234,248,0.55)] transition-colors hover:text-white hover:bg-white/5 font-['Outfit']"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
