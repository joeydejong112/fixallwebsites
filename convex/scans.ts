import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createScan = mutation({
  args: { userId: v.string(), url: v.string() },
  handler: async (ctx, { userId, url }) => {
    return await ctx.db.insert('scans', {
      userId,
      url,
      status: 'pending',
    })
  },
})

export const getScansByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('scans')
      .withIndex('by_user', q => q.eq('userId', userId))
      .order('desc')
      .take(20)
  },
})

export const getScan = query({
  args: { scanId: v.id('scans') },
  handler: async (ctx, { scanId }) => {
    return await ctx.db.get(scanId)
  },
})

export const updateScan = internalMutation({
  args: {
    scanId: v.id('scans'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('done'),
      v.literal('error'),
    ),
    securityScore: v.optional(v.number()),
    performanceScore: v.optional(v.number()),
    seoScore: v.optional(v.number()),
    overallScore: v.optional(v.number()),
    issues: v.optional(v.array(v.object({
      pillar: v.string(),
      severity: v.union(v.literal('critical'), v.literal('warning'), v.literal('pass')),
      title: v.string(),
      description: v.string(),
    }))),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { scanId, ...updates }) => {
    await ctx.db.patch(scanId, updates)
  },
})
