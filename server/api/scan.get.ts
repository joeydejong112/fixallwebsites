import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const convex = new ConvexHttpClient(config.public.convexUrl as string)

  // Validate Bearer token
  const auth = getHeader(event, 'authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const raw = auth.slice(7).trim()
  const apiKey = await convex.query(api.apiKeys.validateApiKeyPublic, { raw })
  if (!apiKey) {
    setResponseStatus(event, 401)
    return { error: 'Invalid API key' }
  }

  const scanId = getQuery(event).id as string
  if (!scanId) {
    setResponseStatus(event, 400)
    return { error: 'Missing id' }
  }

  const scan = await convex.query(api.scans.getScan, { scanId: scanId as any })
  if (!scan) {
    setResponseStatus(event, 404)
    return { error: 'Scan not found' }
  }
  if (scan.userId !== apiKey.userId) {
    setResponseStatus(event, 403)
    return { error: 'Forbidden' }
  }

  return scan
})
