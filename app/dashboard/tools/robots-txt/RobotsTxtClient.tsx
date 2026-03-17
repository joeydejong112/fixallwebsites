"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rule {
  id: string;
  userAgent: string;
  allow: string;
  disallow: string;
}

export function RobotsTxtClient({ clerkId }: { clerkId: string }) {
  const user = useQuery(api.users.getByClerkId, { clerkId });

  const [rules, setRules] = useState<Rule[]>([
    { id: "1", userAgent: "*", allow: "", disallow: "/admin/" }
  ]);
  const [sitemapUrl, setSitemapUrl] = useState("https://example.com/sitemap.xml");
  const [output, setOutput] = useState("");

  useEffect(() => {
    let result = "";
    for (const rule of rules) {
      if (!rule.userAgent.trim()) continue;
      result += `User-agent: ${rule.userAgent.trim()}\n`;
      
      const disallows = rule.disallow.split(",").map(s => s.trim()).filter(Boolean);
      for (const d of disallows) {
        result += `Disallow: ${d}\n`;
      }
      
      const allows = rule.allow.split(",").map(s => s.trim()).filter(Boolean);
      for (const a of allows) {
        result += `Allow: ${a}\n`;
      }
      
      result += "\n";
    }

    if (sitemapUrl.trim()) {
      result += `Sitemap: ${sitemapUrl.trim()}\n`;
    }

    setOutput(result.trim());
  }, [rules, sitemapUrl]);

  const addRule = () => {
    setRules([...rules, { id: Math.random().toString(), userAgent: "Googlebot", allow: "", disallow: "" }]);
  };

  const removeRule = (id: string) => {
    if (rules.length === 1) return; // Keep at least one
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, field: keyof Rule, value: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const downloadFile = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (user === undefined) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#7c6aff]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2 flex items-center gap-3">
          <FileText size={24} className="text-[#a89dff]" />
          Robots.txt Builder
        </h1>
        <p className="text-[15px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
          Visually build a valid <code className="bg-white/10 px-1 py-0.5 rounded text-white/70">robots.txt</code> file for search engine crawlers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Editor */}
        <div className="space-y-6">
          <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 space-y-6">
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px]">Crawler Rules</h3>
                <button
                  onClick={addRule}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[rgba(124,106,255,0.1)] hover:bg-[rgba(124,106,255,0.15)] border border-[rgba(124,106,255,0.2)] text-[#a89dff] text-[12px] font-['Outfit'] font-[600] transition-colors"
                >
                  <Plus size={14} /> Add Rule
                </button>
              </div>

              <div className="space-y-4">
                {rules.map((rule, idx) => (
                  <div key={rule.id} className="p-4 bg-[#0e0d1c] rounded-[12px] border border-white/5 space-y-3 relative group">
                    {rules.length > 1 && (
                      <button 
                        onClick={() => removeRule(rule.id)}
                        className="absolute top-3 right-3 text-white/20 hover:text-[#f87171] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    
                    <div>
                      <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1">User-agent</label>
                      <input
                        value={rule.userAgent}
                        onChange={(e) => updateRule(rule.id, "userAgent", e.target.value)}
                        placeholder="*"
                        className="w-full bg-[#16152a] border border-white/10 rounded-[8px] px-3 py-2 font-['JetBrains Mono',monospace] text-[13px] text-white/80 outline-none focus:border-[rgba(124,106,255,0.4)]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1">Disallow <span className="text-[10px] font-normal opacity-70">(comma separated)</span></label>
                        <input
                          value={rule.disallow}
                          onChange={(e) => updateRule(rule.id, "disallow", e.target.value)}
                          placeholder="/admin/, /private/"
                          className="w-full bg-[#16152a] border border-white/10 rounded-[8px] px-3 py-2 font-['JetBrains Mono',monospace] text-[13px] text-white/80 outline-none focus:border-[rgba(124,106,255,0.4)]"
                        />
                      </div>
                      <div>
                        <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1">Allow <span className="text-[10px] font-normal opacity-70">(comma separated)</span></label>
                        <input
                          value={rule.allow}
                          onChange={(e) => updateRule(rule.id, "allow", e.target.value)}
                          placeholder="/public/"
                          className="w-full bg-[#16152a] border border-white/10 rounded-[8px] px-3 py-2 font-['JetBrains Mono',monospace] text-[13px] text-white/80 outline-none focus:border-[rgba(124,106,255,0.4)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-['Outfit'] font-[600] text-[#eeeaf8] text-[15px] mb-3">Sitemap URL</h3>
              <input
                type="url"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
                className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-3 py-2.5 font-['JetBrains Mono',monospace] text-[13px] text-white/70 outline-none focus:border-[rgba(124,106,255,0.4)]"
              />
            </div>

          </div>
        </div>

        {/* Output */}
        <div className="lg:sticky lg:top-24">
          <div className="bg-[#131220] border border-white/5 rounded-[20px] overflow-hidden flex flex-col h-full">
            <div className="px-5 py-3 border-b border-white/5 bg-[#16152a] flex items-center justify-between">
              <span className="font-['JetBrains Mono',monospace] text-[13px] text-white/60">robots.txt</span>
              <button
                onClick={downloadFile}
                disabled={!output}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#7c6aff] hover:bg-[#6a58e8] disabled:opacity-50 text-white text-[12px] font-[600] font-['Outfit'] transition-colors"
              >
                <Download size={14} /> Download
              </button>
            </div>
            <div className="p-5 overflow-auto">
              <pre className="font-['JetBrains Mono',monospace] text-[13px] leading-relaxed text-[#eeeaf8] whitespace-pre-wrap">
                {output || "# Add a rule to see output"}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
