# SiteFix Setup

## Convex Webhook URL
The Clerk webhook MUST use your `.convex.site` URL, not `.convex.cloud`.

1. Go to Convex Dashboard -> Settings -> URL & Deploy Key
2. Find the "HTTP Actions URL"
3. It looks like `https://your-deployment.convex.site`
4. Use this URL for your Clerk webhook ending in `/clerk-users-webhook`.
