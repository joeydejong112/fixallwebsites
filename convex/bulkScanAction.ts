'use node'

import { action, internalAction } from './_generated/server'
import { v } from 'convex/values'
import { internal, api } from './_generated/api'

/**
 * Public entry point — called once after createBulkScan.
 * Marks the bulk scan as running and kicks off the processing chain.
 */
export const startBulkScan = action({
  args: { bulkScanId: v.id('bulkScans') },
  handler: async (ctx, { bulkScanId }) => {
    await ctx.runMutation(internal.bulkScans.updateBulkScan, {
      bulkScanId,
      status: 'running',
    })
    await ctx.scheduler.runAfter(0, internal.bulkScanAction.processNextScan, { bulkScanId })
  },
})

/**
 * Internal — processes one pending scan from the bulk job, then reschedules
 * itself for the next URL. One-at-a-time chaining keeps each invocation
 * well within Convex action time limits and avoids hammering target servers.
 */
export const processNextScan = internalAction({
  args: { bulkScanId: v.id('bulkScans') },
  handler: async (ctx, { bulkScanId }) => {
    // Get next pending child scan
    const next = await ctx.runQuery(api.bulkScans.getNextPendingScan, { bulkScanId })

    if (!next) {
      // All scans processed — mark bulk scan done
      await ctx.runMutation(internal.bulkScans.updateBulkScan, {
        bulkScanId,
        status: 'done',
      })
      return
    }

    // Run the individual scan (reuses existing runScan action)
    try {
      await ctx.runAction(api.scanAction.runScan, {
        scanId: next._id,
        url: next.url,
      })

      // Fetch updated scan to check final status
      const bulk = await ctx.runQuery(api.bulkScans.getBulkScan, { bulkScanId })
      if (!bulk) return

      const completed = bulk.completedUrls + 1
      const errored   = bulk.errorCount + (/* will be caught below */ 0)

      await ctx.runMutation(internal.bulkScans.updateBulkScan, {
        bulkScanId,
        completedUrls: completed,
      })
    } catch {
      // Individual scan failure — increment error count, keep going
      const bulk = await ctx.runQuery(api.bulkScans.getBulkScan, { bulkScanId })
      if (bulk) {
        await ctx.runMutation(internal.bulkScans.updateBulkScan, {
          bulkScanId,
          completedUrls: bulk.completedUrls + 1,
          errorCount:    bulk.errorCount + 1,
        })
      }
    }

    // Schedule next iteration
    await ctx.scheduler.runAfter(0, internal.bulkScanAction.processNextScan, { bulkScanId })
  },
})
