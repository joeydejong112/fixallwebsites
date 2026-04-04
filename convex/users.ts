import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email:   v.string(),
    name:    v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk', q => q.eq('clerkId', clerkId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        ...(name !== undefined && { name }),
      })
    } else {
      await ctx.db.insert('users', {
        clerkId,
        email,
        name,
        plan: 'free',
        scanCount: 0,
      })
    }
  },
})

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk', q => q.eq('clerkId', clerkId))
      .unique()
    if (!user) return null
    return { plan: user.plan, scanCount: user.scanCount, alertPreferences: user.alertPreferences ?? null }
  },
})

export const updateAlertPreferences = mutation({
  args: {
    clerkId:   v.string(),
    enabled:   v.boolean(),
    threshold: v.number(),
    email:     v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, enabled, threshold, email }) => {
    if (threshold < 0 || threshold > 100) throw new Error('Threshold must be 0–100')
    const user = await ctx.db.query('users').withIndex('by_clerk', q => q.eq('clerkId', clerkId)).unique()
    if (!user) throw new Error('User not found')
    await ctx.db.patch(user._id, {
      alertPreferences: { enabled, threshold, ...(email ? { email } : {}) },
    })
  },
})

export const getUserForAlert = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db.query('users').withIndex('by_clerk', q => q.eq('clerkId', clerkId)).unique()
    if (!user) return null
    return { email: user.email, plan: user.plan, alertPreferences: user.alertPreferences ?? null }
  },
})

export const getStripeCustomerId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db.query('users').withIndex('by_clerk', q => q.eq('clerkId', clerkId)).unique()
    return user?.stripeCustomerId
  }
})

export const updateStripe = internalMutation({
  args: {
    clerkId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    plan: v.union(v.literal('free'), v.literal('pro')),
  },
  handler: async (ctx, args) => {
    let user = null

    if (args.clerkId) {
      user = await ctx.db.query('users').withIndex('by_clerk', q => q.eq('clerkId', args.clerkId as string)).unique()
    } else if (args.stripeCustomerId) {
      user = await ctx.db.query('users').withIndex('by_stripe_customer', q => q.eq('stripeCustomerId', args.stripeCustomerId as string)).unique()
    }
    
    if (!user) {
      console.error('User not found for stripe update', args)
      return
    }

    await ctx.db.patch(user._id, {
      plan: args.plan,
      ...(args.stripeCustomerId !== undefined && { stripeCustomerId: args.stripeCustomerId }),
      ...(args.stripeSubscriptionId !== undefined && { stripeSubscriptionId: args.stripeSubscriptionId }),
      ...(args.stripePriceId !== undefined && { stripePriceId: args.stripePriceId }),
    })
  }
})
