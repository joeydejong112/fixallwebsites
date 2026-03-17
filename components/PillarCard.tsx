"use client";

import { LucideIcon, Search, Shield, Zap, Eye, Settings, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const getPillarIcon = (pillar: string): LucideIcon => {
  switch (pillar.toLowerCase()) {
    case "seo": return Search;
    case "security": return Shield;
    case "performance": return Zap;
    case "accessibility": return Eye;
    case "technical": return Settings;
    case "mobile": return Smartphone;
    default: return Settings;
  }
};

const getColor = (s: number) => {
  if (s >= 80) return "var(--green)";
  if (s >= 60) return "var(--amber)";
  return "var(--red)";
};

export function PillarCard({
  pillar,
  score,
  active,
  onClick,
  animationDelay = 0,
}: {
  pillar: string;
  score: number;
  active: boolean;
  onClick: () => void;
  animationDelay?: number;
}) {
  const Icon = getPillarIcon(pillar);
  const color = getColor(score);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-[10px_8px] rounded-[12px] border text-left outline-none transition-all duration-200 overflow-hidden group",
        active
          ? "bg-[rgba(124,106,255,0.05)] border-[rgba(124,106,255,0.3)] shadow-[0_0_0_3px_rgba(124,106,255,0.05)]"
          : "bg-[#131220] border-white/5 hover:bg-[#1a1830] hover:border-white/10"
      )}
      style={{
        animation: mounted ? `pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards` : "none",
        animationDelay: `${animationDelay}s`,
        opacity: mounted ? 0 : 0, // start invisible to let animation handle it
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-2 z-10 w-full">
        <Icon size={22} className={cn("transition-colors", active ? "text-[--purple]" : "text-white/40")} />
        
        <div className="flex flex-col items-center w-full">
          <span 
            className="text-[9px] uppercase tracking-[0.04em] text-[rgba(238,234,248,0.35)] font-['Outfit'] font-medium mb-1"
          >
            {pillar}
          </span>
          <span 
            className="text-[17px] font-['Outfit'] font-extrabold"
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      
      {/* Background Progress Bar (Subtle) */}
      <div 
        className="absolute bottom-0 left-0 h-[3px] opacity-80"
        style={{
          width: mounted ? `${score}%` : '0%',
          backgroundColor: color,
          transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${animationDelay + 0.2}s`,
        }}
      />
    </button>
  );
}
