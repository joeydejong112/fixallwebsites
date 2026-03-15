import { v } from "convex/values";
import { query } from "./_generated/server";

export const getScanResults = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, args) => {
    // Basic auth check can go here later, skipping for now since only authorized UI routes access it usually
    // Or we could verify against `scans` table `userId`
    const scan = await ctx.db.get(args.scanId);
    if (!scan) return null;

    const results = await ctx.db
      .query("scanResults")
      .withIndex("by_scan_id", (q) => q.eq("scanId", args.scanId))
      .collect();

    return { scan, results };
  },
});

export const getUserScans = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scans")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
