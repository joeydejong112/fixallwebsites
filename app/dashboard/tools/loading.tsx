"use client";



export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <div className="h-10 w-64 bg-white/5 rounded-[8px] mb-2 animate-pulse" />
        <div className="h-5 w-96 bg-white/5 rounded-[4px] animate-pulse" />
      </div>
      <div className="h-[400px] w-full bg-[#131220] border border-white/5 rounded-[20px] animate-pulse" />
    </div>
  );
}
