import { mutation, query, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'

export const addMonitor = mutation({
  args: { userId: v.string(), url: v.string(), frequency: v.union(v.literal('daily'), v.literal('weekly')) },
  handler: async (ctx, { userId, url, frequency }) => {
    // Only Pro users can add monitors
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk', q => q.eq('clerkId', userId))
      .unique()
    
    if (!user || user.plan !== 'pro') {
      throw new Error('Monitoring is a Pro-tier feature. Upgrade to watch your sites.')
    }

    // Check if monitor already exists for this URL
    const existing = await ctx.db
      .query('monitoredSites')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('url'), url))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, { isActive: true, frequency })
    }

    return await ctx.db.insert('monitoredSites', {
      userId,
      url,
      frequency,
      isActive: true,
      lastRunTime: Date.now() // Treat creation as first run reference
    })
  }
})

export const removeMonitor = mutation({
  args: { monitorId: v.id('monitoredSites'), userId: v.string() },
  handler: async (ctx, { monitorId, userId }) => {
    const monitor = await ctx.db.get(monitorId)
    if (!monitor) throw new Error('Not found')
    if (monitor.userId !== userId) throw new Error('Unauthorized')
    
    await ctx.db.delete(monitorId)
  }
})

export const getMonitors = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('monitoredSites')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect()
  }
})

export const getMonitorByUrl = internalQuery({
  args: { userId: v.string(), url: v.string() },
  handler: async (ctx, { userId, url }) => {
    return await ctx.db
      .query('monitoredSites')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.and(q.eq(q.field('url'), url), q.eq(q.field('isActive'), true)))
      .first()
  }
})

export const updateMonitorState = internalMutation({
  args: { monitorId: v.id('monitoredSites'), score: v.number() },
  handler: async (ctx, { monitorId, score }) => {
    await ctx.db.patch(monitorId, { 
      lastRunTime: Date.now(),
      lastScore: score
    })
  }
})

export const getDueMonitors = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allActive = await ctx.db
      .query('monitoredSites')
      .withIndex('by_active', q => q.eq('isActive', true))
      .collect()
    
    const now = Date.now()
    
    return allActive.filter(m => {
      // If we've never run it (null), it's due
      const msSinceLast = now - (m.lastRunTime || 0)
      const threshold = m.frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
      return msSinceLast >= threshold
    })
  }
})

import { internalAction } from './_generated/server'
import { api, internal } from './_generated/api'

export const processDueMonitors = internalAction({
  args: {},
  handler: async (ctx) => {
    const dueMonitors = await ctx.runQuery(internal.monitors.getDueMonitors)
    
    for (const monitor of dueMonitors) {
      try {
        const scanId = await ctx.runMutation(api.scans.createScan, { userId: monitor.userId, url: monitor.url })
        await ctx.runAction(api.scanAction.runScan, { scanId, url: monitor.url })
        
        const finishedScan = await ctx.runQuery(api.scans.getScan, { scanId })
        
        if (finishedScan && finishedScan.overallScore != null) {
          if (monitor.lastScore != null) {
            await ctx.runAction(internal.alerts.checkAndSendAlert, {
              userId: monitor.userId,
              url: monitor.url,
              newScore: finishedScan.overallScore,
              previousScore: monitor.lastScore
            })
          }
          
          await ctx.runMutation(internal.monitors.updateMonitorState, {
            monitorId: monitor._id,
            score: finishedScan.overallScore
          })
        }
      } catch (e) {
        console.error(`Failed scheduled run for ${monitor.url}:`, e)
      }
    }
  }
})
