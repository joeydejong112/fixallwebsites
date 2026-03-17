import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getSitemapJob = query({
  args: { jobId: v.id("sitemapJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const startSitemapJob = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");
    if (user.plan === "free") throw new Error("Upgrade required");

    let finalUrl = args.url;
    if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;

    const jobId = await ctx.db.insert("sitemapJobs", {
      userId: clerkId,
      url: finalUrl,
      status: "running",
      pagesFound: 0,
      urls: [],
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.sitemapGenerator.crawl, {
      jobId,
      url: finalUrl,
    });

    return jobId;
  },
});

export const updateSitemapJob = internalMutation({
  args: {
    jobId: v.id("sitemapJobs"),
    status: v.union(v.literal("running"), v.literal("complete"), v.literal("error")),
    urls: v.array(v.string()),
    errorMessage: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      urls: args.urls,
      pagesFound: args.urls.length,
    });
  },
});
