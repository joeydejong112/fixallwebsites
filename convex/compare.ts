'use node'

import { action } from './_generated/server'
import { v } from 'convex/values'
import { api, internal } from './_generated/api'

export const compareScans = action({
  args: {
    userId: v.string(),
    urlA:   v.string(),
    urlB:   v.string(),
  },
  handler: async (ctx, { userId, urlA, urlB }) => {
    const [scanIdA, scanIdB] = await Promise.all([
      ctx.runMutation(api.scans.createScan, { userId, url: urlA }),
      ctx.runMutation(api.scans.createScan, { userId, url: urlB }),
    ])

    // Fire both scans concurrently via scheduler (non-blocking)
    await Promise.all([
      ctx.scheduler.runAfter(0, internal.scanAction.runScan, { scanId: scanIdA, url: urlA }),
      ctx.scheduler.runAfter(0, internal.scanAction.runScan, { scanId: scanIdB, url: urlB }),
    ])

    return { scanIdA, scanIdB }
  },
})
