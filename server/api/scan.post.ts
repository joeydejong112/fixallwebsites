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

  // Parse body
  let body: any
  try { body = await readBody(event) } catch {
    setResponseStatus(event, 400)
    return { error: 'Invalid JSON' }
  }
  const url = body?.url
  if (!url || typeof url !== 'string') {
    setResponseStatus(event, 400)
    return { error: 'Missing url' }
  }

  // Create scan + fire runScan (fire-and-forget via separate call)
  const scanId = await convex.mutation(api.scans.createScan, { userId: apiKey.userId, url })
  convex.action(api.scanAction.runScan, { scanId, url }).catch(() => {})

  // Stamp lastUsedAt
  await convex.mutation(api.apiKeys.touchLastUsed, { keyId: apiKey._id })

  setResponseStatus(event, 202)
  return { scanId, status: 'running' }
})
