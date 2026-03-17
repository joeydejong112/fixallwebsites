"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Share2, Copy, CheckCheck, Loader2 } from "lucide-react";

export function OpenGraphClient({ clerkId }: { clerkId: string }) {
  const user = useQuery(api.users.getByClerkId, { clerkId });

  const [title, setTitle] = useState("My Awesome Website");
  const [description, setDescription] = useState("This is what will show up when people share your link on Twitter, LinkedIn, and Facebook.");
  const [url, setUrl] = useState("https://example.com");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&h=630&fit=crop");
  const [siteName, setSiteName] = useState("MyBrand");
  const [copied, setCopied] = useState(false);

  const metaHtml = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:site_name" content="${siteName}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${description}">
<meta property="twitter:image" content="${imageUrl}">`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(metaHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (user === undefined) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-[#7c6aff]" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-[800] tracking-[-0.04em] text-[#eeeaf8] font-['Outfit'] mb-2 flex items-center gap-3">
          <Share2 size={24} className="text-[#a89dff]" />
          Open Graph Builder
        </h1>
        <p className="text-[15px] text-[rgba(238,234,248,0.55)] font-['Outfit']">
          Live preview how your links will look when shared on social media, and generate the required meta tags.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Editor */}
        <div className="bg-[#131220] border border-white/5 rounded-[20px] p-6 space-y-5">
          <div>
            <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1.5 uppercase tracking-widest">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-2.5 font-['Outfit'] text-[14px] text-white/90 outline-none focus:border-[rgba(124,106,255,0.4)]"
            />
          </div>
          <div>
            <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1.5 uppercase tracking-widest">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-2.5 font-['Outfit'] text-[14px] text-white/90 outline-none focus:border-[rgba(124,106,255,0.4)] resize-none"
            />
          </div>
          <div>
            <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1.5 uppercase tracking-widest">Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-2.5 font-['Outfit'] text-[14px] text-white/90 outline-none focus:border-[rgba(124,106,255,0.4)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1.5 uppercase tracking-widest">Site Name</label>
              <input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-2.5 font-['Outfit'] text-[14px] text-white/90 outline-none focus:border-[rgba(124,106,255,0.4)]"
              />
            </div>
            <div>
              <label className="block font-['Outfit'] text-[12px] font-[600] text-white/50 mb-1.5 uppercase tracking-widest">Canonical URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#0e0d1c] border border-white/10 rounded-[10px] px-4 py-2.5 font-['Outfit'] text-[14px] text-white/90 outline-none focus:border-[rgba(124,106,255,0.4)]"
              />
            </div>
          </div>
        </div>

        {/* Preview & Output */}
        <div className="space-y-6 lg:sticky lg:top-24">
          
          {/* Social Preview */}
          <div>
            <h3 className="font-['Outfit'] text-[12px] font-[600] text-white/40 uppercase tracking-widest mb-3 px-1">Live Facebook / LinkedIn Preview</h3>
            <div className="bg-white border border-[#dadde1] rounded-lg overflow-hidden shadow-sm">
              <div 
                className="w-full h-[200px] bg-gray-200 border-b border-[#dadde1] bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
              <div className="p-3">
                <div className="text-[12px] text-[#606770] uppercase translate-y-[1px] mb-0.5 font-sans">
                  {new URL(url || "https://example.com").hostname.toUpperCase()}
                </div>
                <div className="font-[600] text-[16px] text-[#1d2129] leading-tight mb-1 font-sans line-clamp-1">
                  {title || "Untitled"}
                </div>
                <div className="text-[14px] text-[#606770] leading-snug font-sans line-clamp-1">
                  {description || "No description provided."}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#131220] border border-white/5 rounded-[20px] overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-white/5 bg-[#16152a] flex items-center justify-between">
              <span className="font-['JetBrains Mono',monospace] text-[13px] text-white/60">HTML Meta Tags</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-[12px] font-[600] font-['Outfit'] transition-colors"
              >
                {copied ? <CheckCheck size={14} className="text-[#6ee7b7]" /> : <Copy size={14} />}
                {copied ? "Copied HTML" : "Copy HTML"}
              </button>
            </div>
            <div className="p-5 overflow-auto max-h-[300px]">
              <pre className="font-['JetBrains Mono',monospace] text-[12px] leading-relaxed text-[#a89dff] whitespace-pre-wrap">
                {metaHtml}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
