import { internalAction } from './_generated/server'
import { v } from 'convex/values'

export const sendAlertEmail = internalAction({
  args: {
    to:            v.string(),
    url:           v.string(),
    newScore:      v.number(),
    previousScore: v.number(),
    threshold:     v.number(),
    hostingUrl:    v.string(),
  },
  handler: async (_ctx, { to, url, newScore, previousScore, threshold, hostingUrl }) => {
    // @ts-ignore
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set — skipping alert email.')
      return
    }

    const drop        = previousScore - newScore
    const scoreColor  = newScore >= 80 ? '#00d4aa' : newScore >= 50 ? '#ffaa00' : '#ff4757'
    const resultsUrl  = `${hostingUrl}/results?url=${encodeURIComponent(url)}`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ScanPulse Alert</title>
</head>
<body style="margin:0;padding:0;background:#07070a;font-family:'DM Sans',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding-bottom:32px;">
            <span style="font-family:'Space Grotesk',Arial,sans-serif;font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.02em;">
              Scan<span style="color:#ec3586;">Pulse</span>
            </span>
          </td>
        </tr>

        <!-- Alert card -->
        <tr>
          <td style="background:#0f0f14;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:36px;">

            <!-- Eyebrow -->
            <p style="margin:0 0 20px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#ec3586;">
              SCORE ALERT
            </p>

            <!-- Headline -->
            <h1 style="margin:0 0 8px;font-family:'Space Grotesk',Arial,sans-serif;font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.03em;">
              Score dropped below ${threshold}
            </h1>
            <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
              Your monitored site <strong style="color:rgba(255,255,255,0.8);">${url}</strong> recorded a lower health score than your alert threshold.
            </p>

            <!-- Score comparison -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px;">Previous</div>
                    <div style="font-family:'Space Grotesk',Arial,sans-serif;font-size:2.5rem;font-weight:700;color:#fff;">${previousScore}</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px;">Now</div>
                    <div style="font-family:'Space Grotesk',Arial,sans-serif;font-size:2.5rem;font-weight:700;color:${scoreColor};">${newScore}</div>
                  </div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:13px;color:rgba(255,255,255,0.35);text-align:center;">
              Drop of <strong style="color:#ff4757;">−${drop} points</strong> · Your threshold is <strong style="color:rgba(255,255,255,0.6);">${threshold}</strong>
            </p>

            <!-- CTA -->
            <a href="${resultsUrl}" style="display:block;background:#ec3586;color:#fff;text-align:center;text-decoration:none;font-family:'Space Grotesk',Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.04em;padding:14px 24px;border-radius:10px;">
              View full report →
            </a>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);">
              You're receiving this because you enabled score alerts in
              <a href="${hostingUrl}/settings" style="color:rgba(255,255,255,0.35);text-decoration:none;">ScanPulse Settings</a>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ScanPulse Alerts <alerts@scanpulse.io>',
        to,
        subject: `⚠ Score alert: ${url} dropped to ${newScore}`,
        html,
      }),
    })

    if (!res.ok) {
      console.error('Resend error:', await res.text())
    }
  },
})
