import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'

const MAX_URLS = 50

export const createBulkScan = mutation({
  args: {
    userId: v.string(),
    name:   v.string(),
    urls:   v.array(v.string()),
  },
  handler: async (ctx, { userId, name, urls }) => {
    // Verify Pro plan
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk', q => q.eq('clerkId', userId))
      .unique()
    if (!user || user.plan !== 'pro') {
      throw new Error('Bulk scan requires a Pro plan.')
    }
    if (urls.length === 0) throw new Error('No URLs provided.')
    if (urls.length > MAX_URLS) throw new Error(`Maximum ${MAX_URLS} URLs per bulk scan.`)

    const bulkScanId = await ctx.db.insert('bulkScans', {
      userId,
      name,
      status:        'pending',
      totalUrls:     urls.length,
      completedUrls: 0,
      errorCount:    0,
    })

    for (const url of urls) {
      await ctx.db.insert('scans', {
        userId,
        url,
        status: 'pending',
        bulkScanId,
      })
    }

    return bulkScanId
  },
})

export const getBulkScan = query({
  args: { bulkScanId: v.id('bulkScans') },
  handler: async (ctx, { bulkScanId }) => {
    return await ctx.db.get(bulkScanId)
  },
})

export const getBulkScanWithScans = query({
  args: { bulkScanId: v.id('bulkScans') },
  handler: async (ctx, { bulkScanId }) => {
    const bulk = await ctx.db.get(bulkScanId)
    if (!bulk) return null
    const scans = await ctx.db
      .query('scans')
      .withIndex('by_bulk', q => q.eq('bulkScanId', bulkScanId))
      .take(MAX_URLS)
    return { bulk, scans }
  },
})

export const getBulkScansByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('bulkScans')
      .withIndex('by_user', q => q.eq('userId', userId))
      .order('desc')
      .take(20)
  },
})

export const updateBulkScan = internalMutation({
  args: {
    bulkScanId:    v.id('bulkScans'),
    status:        v.optional(v.union(v.literal('pending'), v.literal('running'), v.literal('done'), v.literal('error'))),
    completedUrls: v.optional(v.number()),
    errorCount:    v.optional(v.number()),
  },
  handler: async (ctx, { bulkScanId, ...updates }) => {
    await ctx.db.patch(bulkScanId, updates)
  },
})

export const deleteBulkScan = mutation({
  args: { bulkScanId: v.id('bulkScans'), userId: v.string() },
  handler: async (ctx, { bulkScanId, userId }) => {
    const bulk = await ctx.db.get(bulkScanId)
    if (!bulk) throw new Error('Bulk scan not found.')
    if (bulk.userId !== userId) throw new Error('Unauthorized.')
    await ctx.db.delete(bulkScanId)
    // Child scans remain accessible individually in scan history
  },
})

export const getNextPendingScan = query({
  args: { bulkScanId: v.id('bulkScans') },
  handler: async (ctx, { bulkScanId }) => {
    const scans = await ctx.db
      .query('scans')
      .withIndex('by_bulk', q => q.eq('bulkScanId', bulkScanId))
      .take(MAX_URLS)
    return scans.find(s => s.status === 'pending') ?? null
  },
})
