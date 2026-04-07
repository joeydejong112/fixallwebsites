# ScanPulse Public API

**Base URL**: `https://hip-bass-536.eu-west-1.convex.site`
**Auth**: `Authorization: Bearer YOUR_API_KEY` (Pro plan required)

## Endpoints

### `POST /api/v1/scan`
Submit a URL for scanning.

```bash
curl -X POST https://hip-bass-536.eu-west-1.convex.site/api/v1/scan \
  -H "Authorization: Bearer $SCANPULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://yoursite.com"}'
```

Response `201`:
```json
{ "scanId": "...", "status": "pending", "pollUrl": "/api/v1/scan/{scanId}" }
```

---

### `GET /api/v1/scan/{scanId}`
Poll for results. Keep polling every 2–5 seconds until `status` is `done` or `error`.

```bash
curl https://hip-bass-536.eu-west-1.convex.site/api/v1/scan/{scanId} \
  -H "Authorization: Bearer $SCANPULSE_API_KEY"
```

Response `200` when done:
```json
{
  "scanId": "...",
  "url": "https://yoursite.com",
  "status": "done",
  "scores": { "overall": 74, "security": 80, "performance": 65, "seo": 72, "accessibility": 90, "ai": 60 },
  "issues": [{ "pillar": "security", "severity": "critical", "title": "...", "description": "..." }],
  "scannedAt": "2026-04-07T10:00:00.000Z"
}
```

---

### `GET /api/v1/scans`
List your scans. Optional query params: `?status=done` and `?limit=N` (max 100).

---

## GitHub Actions — CI/CD Health Gate

Add this workflow to your repo as `.github/workflows/scanpulse.yml`:

```yaml
name: ScanPulse Health Check

on:
  push:
    branches: [main]

jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - name: Submit scan
        id: scan
        run: |
          SCAN_ID=$(curl -s -X POST \
            https://hip-bass-536.eu-west-1.convex.site/api/v1/scan \
            -H "Authorization: Bearer ${{ secrets.SCANPULSE_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"url":"https://yoursite.com"}' | jq -r '.scanId')
          echo "scan_id=$SCAN_ID" >> "$GITHUB_OUTPUT"

      - name: Poll until done
        run: |
          SCAN_ID=${{ steps.scan.outputs.scan_id }}
          for i in $(seq 1 30); do
            RESULT=$(curl -s \
              https://hip-bass-536.eu-west-1.convex.site/api/v1/scan/$SCAN_ID \
              -H "Authorization: Bearer ${{ secrets.SCANPULSE_API_KEY }}")
            STATUS=$(echo $RESULT | jq -r '.status')
            if [ "$STATUS" = "done" ] || [ "$STATUS" = "error" ]; then
              echo "$RESULT"
              SCORE=$(echo $RESULT | jq -r '.scores.overall // 0')
              if [ "$STATUS" = "error" ]; then echo "Scan failed"; exit 1; fi
              if [ "$SCORE" -lt 70 ]; then
                echo "Health gate failed: overall score $SCORE < 70"
                exit 1
              fi
              echo "Health gate passed: score $SCORE"
              exit 0
            fi
            sleep 10
          done
          echo "Timed out waiting for scan"
          exit 1
```

Set `SCANPULSE_API_KEY` as a GitHub Actions secret in your repository settings.
