import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

let _client: ConvexHttpClient | null = null

export function useConvex() {
  if (!_client) {
    const config = useRuntimeConfig()
    _client = new ConvexHttpClient(config.public.convexUrl as string)
  }
  return { client: _client, api }
}
