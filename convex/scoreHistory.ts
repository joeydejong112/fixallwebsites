import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

export const recordSnapshot = internalMutation({
  args: {
    userId:             v.string(),
    url:                v.string(),
    scanId:             v.id('scans'),
    ts:                 v.number(),
    overallScore:       v.optional(v.number()),
    securityScore:      v.optional(v.number()),
    performanceScore:   v.optional(v.number()),
    seoScore:           v.optional(v.number()),
    accessibilityScore: v.optional(v.number()),
    aiScore:            v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('scoreHistory', args)
  },
})

export const getHistory = query({
  args: { userId: v.string(), url: v.string() },
  handler: async (ctx, { userId, url }) => {
    return await ctx.db
      .query('scoreHistory')
      .withIndex('by_user_url_ts', q => q.eq('userId', userId).eq('url', url))
      .order('asc')
      .take(90)
  },
})

export const getHistoryForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Return last snapshot per unique URL (up to 20 URLs)
    const all = await ctx.db
      .query('scoreHistory')
      .withIndex('by_user_url', q => q.eq('userId', userId))
      .order('desc')
      .take(200)

    const seen = new Map<string, typeof all[0]>()
    for (const row of all) {
      if (!seen.has(row.url)) seen.set(row.url, row)
      if (seen.size >= 20) break
    }
    return [...seen.values()]
  },
})

export const getRecentHistory = query({
  args: { userId: v.string(), url: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, url, limit }) => {
    return await ctx.db
      .query('scoreHistory')
      .withIndex('by_user_url_ts', q => q.eq('userId', userId).eq('url', url))
      .order('desc')
      .take(limit ?? 10)
  },
})
