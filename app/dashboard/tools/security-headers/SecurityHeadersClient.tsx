"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShieldCheck, Copy, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigState {
  hsts: boolean;
  hstsSubdomains: boolean;
  hstsPreload: boolean;
  xFrameOptions: "DENY" | "SAMEORIGIN" | "NONE";
  contentTypeOptions: boolean;
  referrerPolicy: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "strict-origin-when-cross-origin" | "same-origin" | "strict-origin";
  contentSecurityPolicy: string;
  permissionsPolicy: string;
}

export function SecurityHeadersClient({ clerkId }: { clerkId: string }) {
  const user = useQuery(api.users.getByClerkId, { clerkId });
  const [copied, setCopied] = useState(false);

  const [config, setConfig] = useState<ConfigState>({
    hsts: true,
    hstsSubdomains: true,
    hstsPreload: true,
    xFrameOptions: "DENY",
    contentTypeOptions: true,
    referrerPolicy: "strict-origin-when-cross-origin",
    contentSecurityPolicy: "default-src 'self';",
    permissionsPolicy: "camera=(), microphone=(), geolocation=()"
  });

  const [nginxOutput, setNginxOutput] = useState("");

  useEffect(() => {
    let output = "";
    if (config.hsts) {
      let hstsVal = "max-age=31536000";
      if (config.hstsSubdomains) hstsVal += "; includeSubDomains";
      if (config.hstsPreload) hstsVal += "; preload";
      output += `add_header Strict-Transport-Security "${hstsVal}" always;\n`;
    }
    if (config.xFrameOptions !== "NONE") {
      output += `add_header X-Frame-Options "${config.xFrameOptions}" always;\n`;
    }
    if (config.contentTypeOptions) {
      output += `add_header X-Content-Type-Options "nosniff" always;\n`;
    }
    output += `add_header Referrer-Policy "${config.referrerPolicy}" always;\n`;
    
    if (config.contentSecurityPolicy.trim()) {
      output += `add_header Content-Security-Policy "${config.contentSecurityPolicy.trim()}" always;\n`;
    }
    if (config.permissionsPolicy.trim()) {
      output += `add_header Permissions-Policy "${config.permissionsPolicy.trim()}" always;\n`;
    }

    setNginxOutput(output.trim());
  }, [config]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(nginxOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (user === undefined) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#7c6aff]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2 flex items-center gap-3">
          <ShieldCheck size={24} className="text-[#a89dff]" />
          Security Headers Generator
        </h1>
        <p className="text-[15px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
          Generate robust <code className="bg-white/10 px-1 py-0.5 rounded text-white/70">nginx.conf</code> snippets for 
          server-side HTTP security headers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Intend Controls */}
        <div className="space-y-6">
          <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 space-y-6">
            
            {/* HSTS */}
            <div>
              <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px] mb-3">Strict-Transport-Security (HSTS)</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={config.hsts} onChange={(e) => setConfig({ ...config, hsts: e.target.checked })} className="accent-[#7c6aff] w-4 h-4 rounded" />
                  <span className="font-['Outfit'] text-[14px] text-white/70">Enable HSTS</span>
                </label>
                {config.hsts && (
                  <div className="pl-7 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={config.hstsSubdomains} onChange={(e) => setConfig({ ...config, hstsSubdomains: e.target.checked })} className="accent-[#7c6aff]" />
                      <span className="font-['Outfit'] text-[13px] text-white/50">includeSubDomains</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={config.hstsPreload} onChange={(e) => setConfig({ ...config, hstsPreload: e.target.checked })} className="accent-[#7c6aff]" />
                      <span className="font-['Outfit'] text-[13px] text-white/50">preload</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* X-Frame-Options */}
            <div>
              <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px] mb-3">X-Frame-Options</h3>
              <select 
                value={config.xFrameOptions}
                onChange={(e) => setConfig({ ...config, xFrameOptions: e.target.value as any })}
                className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-3 py-2.5 font-['Outfit'] text-[14px] text-white/70 outline-none focus:border-[rgba(124,106,255,0.4)]"
              >
                <option value="DENY">DENY (Recommended)</option>
                <option value="SAMEORIGIN">SAMEORIGIN</option>
                <option value="NONE">Disabled</option>
              </select>
            </div>

            {/* X-Content-Type-Options */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={config.contentTypeOptions} onChange={(e) => setConfig({ ...config, contentTypeOptions: e.target.checked })} className="accent-[#7c6aff] w-4 h-4 rounded" />
                <span className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px]">X-Content-Type-Options (nosniff)</span>
              </label>
            </div>

            {/* Referrer-Policy */}
            <div>
              <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px] mb-3">Referrer-Policy</h3>
              <select 
                value={config.referrerPolicy}
                onChange={(e) => setConfig({ ...config, referrerPolicy: e.target.value as any })}
                className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-3 py-2.5 font-['Outfit'] text-[14px] text-white/70 outline-none focus:border-[rgba(124,106,255,0.4)]"
              >
                <option value="strict-origin-when-cross-origin">strict-origin-when-cross-origin (Recommended)</option>
                <option value="no-referrer">no-referrer</option>
                <option value="no-referrer-when-downgrade">no-referrer-when-downgrade</option>
                <option value="origin">origin</option>
                <option value="same-origin">same-origin</option>
              </select>
            </div>

            {/* Content-Security-Policy */}
            <div>
              <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px] mb-3">Content-Security-Policy (CSP)</h3>
              <textarea
                value={config.contentSecurityPolicy}
                onChange={(e) => setConfig({ ...config, contentSecurityPolicy: e.target.value })}
                rows={3}
                placeholder="default-src 'self';"
                className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-3 py-3 font-['JetBrains Mono',monospace] text-[13px] text-white/70 outline-none focus:border-[rgba(124,106,255,0.4)] resize-none"
              />
            </div>

            {/* Permissions Policy */}
            <div>
              <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px] mb-3">Permissions-Policy</h3>
              <input
                type="text"
                value={config.permissionsPolicy}
                onChange={(e) => setConfig({ ...config, permissionsPolicy: e.target.value })}
                placeholder="camera=(), microphone=(), geolocation=()"
                className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-3 py-2.5 font-['JetBrains Mono',monospace] text-[13px] text-white/70 outline-none focus:border-[rgba(124,106,255,0.4)]"
              />
            </div>

          </div>
        </div>

        {/* Output */}
        <div className="lg:sticky lg:top-24">
          <div className="bg-[#131220] border border-white/5 rounded-[20px] overflow-hidden flex flex-col h-full">
            <div className="px-5 py-3 border-b border-white/5 bg-[#16152a] flex items-center justify-between">
              <span className="font-['JetBrains Mono',monospace] text-[13px] text-white/60">nginx.conf</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[12px] font-['Outfit'] transition-colors"
              >
                {copied ? <CheckCheck size={14} className="text-[#6ee7b7]" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy output"}
              </button>
            </div>
            <div className="p-5 overflow-auto">
              <pre className="font-['JetBrains Mono',monospace] text-[13px] leading-relaxed text-[#eeeaf8] whitespace-pre-wrap">
                {nginxOutput || "# No headers configured"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
