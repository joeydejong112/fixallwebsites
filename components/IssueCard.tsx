"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Info, CheckCircle2, AlertTriangle, ShieldAlert, Zap, Search, Eye, Smartphone, Settings, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanResult {
  _id?: string;
  pillar: string;
  checkName: string;
  status: "pass" | "warn" | "fail";
  impact: "high" | "medium" | "low";
  plainEnglishDescription: string;
  fixGuide?: any;
  rawValue: string;
}

const getSeverityStyles = (status: "pass" | "warn" | "fail") => {
  if (status === "fail") {
    return {
      badge: "bg-[rgba(248,113,113,0.08)] text-[#f87171] border-[rgba(248,113,113,0.2)]",
      iconBg: "bg-[#f87171]",
      color: "#f87171",
      label: "Critical",
      Icon: ShieldAlert,
    };
  }
  if (status === "warn") {
    return {
      badge: "bg-[rgba(245,158,11,0.08)] text-[#f59e0b] border-[rgba(245,158,11,0.2)]",
      iconBg: "bg-[#f59e0b]",
      color: "#f59e0b",
      label: "Warning",
      Icon: AlertTriangle,
    };
  }
  return {
    badge: "bg-[rgba(110,231,183,0.08)] text-[#6ee7b7] border-[rgba(110,231,183,0.2)]",
    iconBg: "bg-[#6ee7b7]",
    color: "#6ee7b7",
    label: "Passed",
    Icon: CheckCircle2,
  };
};

// Placeholder Animated SVG for illustration area
function AnimatedIllustration({ status, checkName }: { status: string; checkName: string }) {
  const isPass = status === "pass";
  const color = status === "fail" ? "#f87171" : status === "warn" ? "#f59e0b" : "#6ee7b7";
  
  return (
    <div className="w-[100px] h-[100px] rounded-[10px] bg-[#0e0d1c] border border-white/5 flex items-center justify-center relative overflow-hidden shrink-0">
      {/* Background elements */}
      <div 
        className="absolute w-[60px] h-[60px] rounded-full opacity-10" 
        style={{ backgroundColor: color, animation: 'pulse-ring 2s infinite' }}
      />
      {/* Icon floating */}
      <div style={{ animation: 'float 3s ease-in-out infinite' }}>
        {status === "fail" ? <ShieldAlert size={36} color={color} /> : 
         status === "warn" ? <AlertTriangle size={36} color={color} /> : 
         <CheckCircle2 size={36} color={color} />}
      </div>
      {/* Scan beam */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(124,106,255,0.1)] to-transparent h-[20px] w-full" style={{ animation: 'scan-beam 2s linear infinite' }} />
    </div>
  );
}

export function IssueCard({
  issue,
  isBlurred,
  onUpgradeClick,
  stepNumber,
}: {
  issue: ScanResult;
  isBlurred: boolean;
  onUpgradeClick: () => void;
  stepNumber?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [platform, setPlatform] = useState("WordPress");

  const sev = getSeverityStyles(issue.status);

  const toggleExpand = () => {
    if (isBlurred) {
      onUpgradeClick();
    } else {
      setExpanded(!expanded);
    }
  };

  const formattedCheckName = issue.checkName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div 
      className={cn(
        "relative rounded-[14px] border transition-all duration-200 text-left overflow-hidden group",
        expanded 
          ? "bg-[#16152a] border-[rgba(124,106,255,0.25)]" 
          : "bg-[rgba(19,18,32,0.5)] border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.10)]"
      )}
    >
      {/* Clickable Header */}
      <button 
        onClick={toggleExpand}
        className="w-full flex items-start sm:items-center justify-between p-4 outline-none"
      >
        <div className="flex items-start sm:items-center gap-4">
          {/* Status Icon */}
          <div 
            className="flex items-center justify-center w-[44px] h-[44px] rounded-[10px] shrink-0"
            style={{ backgroundColor: `${sev.color}14` /* 8% opacity via hex alpha approx */ }}
          >
            <sev.Icon size={20} color={sev.color} />
          </div>

          <div className="flex flex-col items-start pt-1 sm:pt-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {stepNumber !== undefined && (
                <div className="flex items-center justify-center w-[16px] h-[16px] rounded-full bg-[rgba(124,106,255,0.15)] text-[#a89dff] font-['Outfit'] font-[700] text-[9px] shrink-0">
                  {stepNumber}
                </div>
              )}
              <h3 className="font-['Outfit'] font-[700] text-[13px] text-[#eeeaf8] m-0">
                {formattedCheckName}
              </h3>
              <span className={cn(
                "rounded-[999px] font-['Outfit'] font-[600] text-[10px] tracking-[0.02em] px-[10px] py-[3px] border",
                sev.badge
              )}>
                {sev.label}
              </span>
            </div>
            <p className="font-['Outfit'] font-[400] text-[11px] text-[rgba(238,234,248,0.38)] leading-[1.5] text-left">
              {issue.plainEnglishDescription}
            </p>
          </div>
        </div>

        <div className="ml-4 shrink-0 text-white/30 hidden sm:block">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expanded Content Area with Blur logic inside */}
      {expanded && (
        <div className="relative border-t border-white/5 p-4 sm:p-6">
          <div className={cn("flex flex-col gap-6", isBlurred ? "blur-md opacity-50 select-none" : "")}>
            
            {/* Top row: Illustration + details */}
            <div className="flex flex-col sm:flex-row gap-6">
              <AnimatedIllustration status={issue.status} checkName={issue.checkName} />
              
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex flex-col">
                  <span className="font-['Outfit'] text-[9px] tracking-[0.04em] uppercase text-white/30 mb-1">
                    Raw Value Found
                  </span>
                  <code className="font-['JetBrains_Mono'] text-[12px] text-[#a89dff] bg-[#0e0d1c] p-2 rounded-md border border-white/5 break-all">
                    {issue.rawValue}
                  </code>
                </div>
              </div>
            </div>

            {/* Platform Tabs & Fix section (placeholder for Agent 11 to expand) */}
            <div className="flex flex-col mt-4">
              <span className="font-['Outfit'] font-[700] text-[13px] text-white mb-3">
                How to fix this issue
              </span>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {["WordPress", "Shopify", "Custom Code"].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "rounded-[6px] font-['Outfit'] font-[500] text-[10px] px-3 py-1.5 transition-colors whitespace-nowrap",
                      platform === p 
                        ? "border border-[rgba(124,106,255,0.45)] text-[#a89dff] bg-[rgba(124,106,255,0.08)]"
                        : "border border-[rgba(255,255,255,0.07)] text-[rgba(238,234,248,0.3)] hover:text-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              
              <div className="bg-[#0e0d1c] border border-white/5 rounded-xl p-4">
                <p className="font-['Outfit'] text-[12px] text-white/60 leading-relaxed">
                  Select a platform above to view the exact step-by-step instructions. Note: Fix guides will be provided by future updates. 
                </p>
              </div>
            </div>

          </div>

          {/* CTA Overlay if blurred */}
          {isBlurred && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="bg-[#16152a] border border-[rgba(124,106,255,0.25)] rounded-[14px] p-6 max-w-sm text-center shadow-2xl flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(124,106,255,0.1)] text-[#a89dff] mb-4">
                  <Lock size={24} />
                </div>
                <h4 className="font-['Outfit'] font-[800] text-[18px] text-white mb-2">
                  Pro Feature
                </h4>
                <p className="font-['Outfit'] text-[13px] text-white/50 mb-6">
                  Upgrade your plan to see exact step-by-step fix guides for every issue on your website.
                </p>
                <button
                  onClick={onUpgradeClick}
                  className="w-full rounded-[8px] bg-[#7c6aff] px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90 font-['Outfit']"
                >
                  Unlock Fix Guides
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
