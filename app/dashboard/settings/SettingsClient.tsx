"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Upload, ExternalLink, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsClient({ clerkId }: { clerkId: string }) {
  const user = useQuery(api.users.getByClerkId, { clerkId });

  if (user === undefined) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#7c6aff]" size={32} />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="text-center py-20 text-[#f87171] font-['Outfit']">
        User not found.
      </div>
    );
  }

  const isPro = user.plan === "pro";

  const handleLogoUpload = () => {
    if (!isPro) {
      window.dispatchEvent(
        new CustomEvent("showUpgradeModal", { detail: { trigger: "export-pdf" } })
      );
      return;
    }
    // Mock upload logic for Pro
    alert("Logo upload would open file dialog here.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in animate-in duration-500 pb-20">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2">
          Settings & Billing
        </h1>
        <p className="text-[15px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
          Manage your account, plan details, and report branding.
        </p>
      </div>

      <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-[700] tracking-[-0.02em] text-[#eeeaf8] font-['Outfit'] mb-4 flex items-center gap-2">
            <Zap size={20} className="text-[#a89dff]" />
            Current Plan
          </h2>
          
          <div className="bg-[#0e0d1c] border border-[rgba(255,255,255,0.05)] rounded-[14px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[20px] font-[800] text-white font-['Outfit'] capitalize">
                  {user.plan} Plan
                </span>
                {user.plan === "pro" && (
                  <span className="bg-[rgba(110,231,183,0.08)] text-[#6ee7b7] border border-[rgba(110,231,183,0.2)] rounded-full px-2 py-0.5 text-[10px] font-['Outfit'] uppercase tracking-widest font-bold">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[14px] text-white/50 font-['Outfit']">
                You have used {user.scansThisMonth ?? 0} scans this month.
              </p>
            </div>

            <div className="shrink-0 flex items-center">
              {/* Note: In a real implementation this would trigger Clerk's openUserProfile() focusing on Billing, but for SiteFix rules we link to their settings or use UserProfile hook. For simplest integration, we just provide a link that they manage via Clerk. */}
              <button 
                className="bg-[#1a1830] hover:bg-[#201e3d] border border-white/5 px-4 py-2 rounded-[8px] text-[14px] font-medium text-white transition-colors flex items-center gap-2 font-['Outfit']"
                onClick={() => {
                  alert("This would open Clerk's Billing Portal. Implementation depends on exact Clerk setup (e.g. UserProfile).");
                }}
              >
                Manage Billing
                <ExternalLink size={14} className="opacity-50" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-6 sm:p-8">
        <h2 className="text-lg font-[700] tracking-[-0.02em] text-[#eeeaf8] font-['Outfit'] mb-4 flex items-center gap-2">
          Report Branding
        </h2>
        <p className="text-[14px] text-white/50 font-['Outfit'] mb-6">
          Upload your agency's logo to replace the SiteFix logo on exported PDF reports.
        </p>

        <div className="bg-[#0e0d1c] border border-[rgba(255,255,255,0.05)] rounded-[14px] p-6 flex flex-col items-center justify-center border-dashed">
          <button 
            onClick={handleLogoUpload}
            className={cn(
              "flex flex-col items-center justify-center w-full max-w-sm p-6 rounded-[12px] transition-all duration-200 outline-none",
              isPro 
                ? "bg-[rgba(124,106,255,0.05)] hover:bg-[rgba(124,106,255,0.1)] border border-[rgba(124,106,255,0.2)] hover:border-[rgba(124,106,255,0.4)] cursor-pointer" 
                : "bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4",
              isPro ? "bg-[rgba(124,106,255,0.2)] text-[#a89dff]" : "bg-white/5 text-white/40"
            )}>
              <Upload size={20} />
            </div>
            <span className={cn("font-['Outfit'] font-[600] text-[15px] mb-1", isPro ? "text-[#eeeaf8]" : "text-white/60")}>
              {isPro ? "Click to upload logo" : "Unlock Custom Branding"}
            </span>
            <span className="font-['Outfit'] text-[13px] text-white/40 text-center">
              {isPro ? "SVG, PNG or JPG max 2MB." : "Requires Pro plan to upload custom logos."}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
