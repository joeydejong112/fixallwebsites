import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

let _client: ConvexHttpClient | null = null

export function useConvex() {
  if (!_client) {
    const config = useRuntimeConfig()
    const url = (config.public.convexUrl as string).replace(/\/$/, '')
    _client = new ConvexHttpClient(url)
  }
  return { client: _client, api }
}
