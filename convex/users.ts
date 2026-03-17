import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      return existing;
    }

    const newUserId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      plan: "free",
      scansThisMonth: 0,
      createdAt: Date.now(),
    });

    return await ctx.db.get(newUserId);
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const createFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { email: args.email });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      plan: "free",
      scansThisMonth: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { email: args.email });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const resetMonthlyScanCounts = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.plan === "free") {
        await ctx.db.patch(user._id, { scansThisMonth: 0 });
      }
    }
  },
});

export const syncPlanFromClerk = mutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { plan: args.plan });
    }
  },
});

export const syncPlanFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { plan: args.plan });
    }
  },
});
