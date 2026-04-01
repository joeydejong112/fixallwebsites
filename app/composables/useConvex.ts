import { ConvexHttpClient, ConvexClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

let _client: ConvexHttpClient | null = null
let _wsClient: ConvexClient | null = null

export function useConvex() {
  if (!_client) {
    const config = useRuntimeConfig()
    const url = (config.public.convexUrl as string).replace(/\/$/, '')
    _client = new ConvexHttpClient(url)
  }
  return { client: _client, api }
}

export function useConvexWs() {
  if (import.meta.server) return { client: null, api }
  if (!_wsClient) {
    const config = useRuntimeConfig()
    const url = (config.public.convexUrl as string).replace(/\/$/, '')
    _wsClient = new ConvexClient(url)
  }
  return { client: _wsClient, api }
}
