"use client";

import { useEffect, useState } from "react";

export function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const getColor = (s: number) => {
    if (s >= 80) return "#6ee7b7";
    if (s >= 60) return "#f59e0b";
    return "#f87171";
  };
  const color = getColor(score);

  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // If not mounted, keep it at 0 progress visually (dashoffset = circumference)
  const offset = mounted ? circumference - (score / 100) * circumference : circumference;

  return (
    <div className="relative inline-flex items-center justify-center font-['Outfit']" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/5"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      {/* 48px and 20px for size 88 */}
      <div className="absolute flex items-baseline">
        <span style={{ color, fontSize: Math.max(12, Math.round(size * 0.545)), fontWeight: 800 }}>
          {score}
        </span>
        <span style={{ color: 'rgba(238,234,248,0.2)', fontSize: Math.max(8, Math.round(size * 0.227)), fontWeight: 800 }}>
          /100
        </span>
      </div>
    </div>
  );
}
