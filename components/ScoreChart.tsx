"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export function ScoreChart({ url, userId }: { url: string; userId: string }) {
  const history = useQuery(api.scanQueries.getScanHistory, { userId, url });

  if (history === undefined) {
    return (
       <div className="h-[250px] w-full bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] flex items-center justify-center">
         <Loader2 className="animate-spin text-white/20 w-6 h-6" />
       </div>
    );
  }

  // We only show history if there are 2 or more scans (to draw a line)
  if (history.length < 2) return null;

  const data = history.map(scan => ({
    date: format(new Date(scan.createdAt), "MMM d, HH:mm"),
    score: scan.overallScore || 0,
  }));

  return (
    <div className="bg-[#131220] border border-[rgba(255,255,255,0.05)] rounded-[20px] p-6 mb-8 relative overflow-hidden">
      <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[16px] tracking-tight mb-6">
        Score History
      </h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6aff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c6aff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(238,234,248,0.38)', fontSize: 12, fontFamily: 'Outfit' }}
              dy={10}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(238,234,248,0.38)', fontSize: 12, fontFamily: 'Outfit' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#16152a',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                color: '#eeeaf8',
                fontFamily: 'Outfit'
              }}
              itemStyle={{ color: '#7c6aff', fontWeight: 600 }}
              labelStyle={{ color: 'rgba(238,234,248,0.55)', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#7c6aff" 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
