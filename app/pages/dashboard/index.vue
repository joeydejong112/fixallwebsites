<script setup lang="ts">
/**
 * ScanPulse — Dashboard Overview
 * Ported: ScanPulse.html L2042–L2415
 * Replaces: app/pages/dashboard/index.vue (full rewrite)
 */
import { useScanpulseData } from '~/composables/useScanpulseData'
import type { QuickWin } from '~/composables/useScanpulseData'

definePageMeta({ middleware: 'auth', layout: 'app' })
useSeoMeta({ title: 'Dashboard — ScanPulse' })

const { userId } = useAuth()
const { PILLARS: pillars, SCAN: scanData, QUICK_WINS: quickWins, RECENT: recentScans } = useScanpulseData()

// ── Date label ────────────────────────────────────────────────
const dateLabel = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
})

// ── ScoreRing animation (anime.js dynamic-import) ─────────────
const ringEl = ref<HTMLElement | null>(null)
const ringScore = ref(0)
onMounted(async () => {
  await nextTick()
  const anime = (await import('animejs')).default
  anime({ targets: { t: 0 }, t: scanData.overall, duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', update: (a: { progress: number }) => { ringScore.value = Math.round((a.progress / 100) * scanData.overall) } })
})

// ── Quick win card hover ─────────────────────────────────────
function qwHover(e: MouseEvent, entering: boolean, q: QuickWin) {
  const el = e.currentTarget as HTMLElement
  const p = pillars.find(x => x.key === q.pillar)
  if (!p) return
  if (entering) {
    el.style.boxShadow = `0 0 30px ${p.color}25`
    el.style.borderLeftColor = `${p.color}40`
  } else {
    el.style.boxShadow = 'none'
    el.style.borderLeftColor = p.color
  }
}

// ── Recent scan row hover ────────────────────────────────────
function rsHover(e: MouseEvent, entering: boolean) {
  const el = e.currentTarget as HTMLElement
  el.style.background = entering ? 'rgba(255,255,255,0.015)' : 'transparent'
}

// ── Trend chart SVG ───────────────────────────────────────────
const chartW = 640, chartH = 260, chartPad = 32
const chartPoints = [
  { x: 0, acme: 52, proto: 80 }, { x: 1, acme: 55, proto: 82 }, { x: 2, acme: 58, proto: 83 },
  { x: 3, acme: 62, proto: 85 }, { x: 4, acme: 60, proto: 84 }, { x: 5, acme: 65, proto: 86 },
  { x: 6, acme: 68, proto: 87 }, { x: 7, acme: 68, proto: 88 }, { x: 8, acme: 70, proto: 88 },
  { x: 9, acme: 72, proto: 90 }, { x: 10, acme: 73, proto: 91 }, { x: 11, acme: 74, proto: 88 },
]
const cx = (x: number) => chartPad + (x / 11) * (chartW - chartPad * 2)
const cy = (y: number) => chartPad + (1 - (y - 40) / 60) * (chartH - chartPad * 2 - 20)
const linePath = (key: 'acme' | 'proto') => chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(p.x)},${cy(p[key])}`).join(' ')
const areaPath = `${linePath('acme')} L${cx(11)},${chartH - chartPad} L${cx(0)},${chartH - chartPad} Z`
const latestPt = chartPoints[chartPoints.length - 1]

// ── Monitor feed events ───────────────────────────────────────
interface FeedEvent { when: string; host: string; msg: string; status: 'pass' | 'warn' | 'crit'; pillar: string }
const feedEvents: FeedEvent[] = [
  { when: '04:12', host: 'harbor.build',  msg: 'HSTS header restored',           status: 'pass', pillar: 'security' },
  { when: '03:57', host: 'acme.design',   msg: 'New scan completed',              status: 'pass', pillar: 'performance' },
  { when: '02:21', host: 'lumen.co',      msg: 'LCP regressed to 4.1s',           status: 'warn', pillar: 'performance' },
  { when: '01:03', host: 'lumen.co',      msg: 'CSP header removed on /pricing',  status: 'crit', pillar: 'security' },
  { when: '00:44', host: 'proto.studio',  msg: 'Weekly scan scheduled',            status: 'pass', pillar: 'dns' },
]
</script>

<template>
  <main class="relative flex-1 p-[32px_40px_60px] overflow-hidden" style="background: var(--canvas);">

    <!-- grid-bg overlay -->
    <div class="absolute inset-0 grid-bg" style="opacity: 0.5;" />

    <!-- pink glow radial -->
    <div class="absolute" style="top: -100px; right: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(236, 53, 134, 0.08), transparent 60%); pointer-events: none;" />

    <div class="relative flex flex-col gap-6">

      <!-- ══ DASHBOARD HEADER ══════════════════════════════════ -->
      <div class="flex justify-between items-flex-end">
        <div>
          <div class="eyebrow">Overview · {{ dateLabel }}</div>
          <h1 class="display" style="font-size: 44px; margin: 14px 0 0; letter-spacing: -0.04em; line-height: 0.98;">
            Good morning, Kira.
          </h1>
          <p style="color: var(--text-muted); font-size: 15px; margin: 8px 0 0;">
            3 sites are monitored. 1 regressed overnight.
            <a style="color: var(--brand); cursor: pointer;">Review →</a>
          </p>
        </div>
        <div class="flex gap-[10px]">
          <button class="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New scan
          </button>
          <button class="btn btn-ghost">Bulk upload</button>
          <button class="btn btn-primary">
            Export report
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- ══ HERO SCAN PANEL ══════════════════════════════════ -->
      <div class="card" style="padding: 32px 36px; position: relative;">
        <!-- accent top -->
        <div class="card-accent-top" style="background: linear-gradient(to right, var(--brand), transparent);" />
        <!-- ghost numeral -->
        <div class="ghost-numeral" style="font-size: 260px; top: -30px; right: 20px; color: rgba(255,255,255,0.04);">
          {{ scanData.overall }}
        </div>

        <div class="grid" style="display: grid; grid-template-columns: auto 1fr auto; gap: 48px; align-items: center; position: relative;">

          <!-- Score Ring -->
          <div>
            <div class="relative" style="width: 160px; height: 160px;">
              <svg width="160" height="160" style="transform: rotate(-90deg);">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" :stop-color="'#ec3586'" stop-opacity="1" />
                    <stop offset="100%" :stop-color="'#ec3586'" stop-opacity="0.55" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="66" stroke="rgba(255,255,255,0.06)" stroke-width="14" fill="none" />
                <circle
                  cx="80" cy="80" r="66"
                  stroke="url(#ringGrad)" stroke-width="14" fill="none" stroke-linecap="round"
                  :stroke-dasharray="2 * Math.PI * 66"
                  :stroke-dashoffset="(1 - ringScore / 100) * 2 * Math.PI * 66"
                  style="transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="font-display font-bold tabular-nums tracking-[-0.05em]" style="font-size: 44px; line-height: 1;">
                  {{ ringScore }}
                </div>
                <div class="mt-2 font-display text-[10px] tracking-[0.22em] uppercase" style="color: rgba(255,255,255,0.45);">
                  Overall
                </div>
                <div class="mt-1 font-display font-semibold text-xs" style="color: var(--s-pass);">
                  +6 since last scan
                </div>
              </div>
            </div>
          </div>

          <!-- Pillar breakdown -->
          <div>
            <div class="flex items-center gap-[14px]" style="margin-bottom: 22px;">
              <!-- Favicon -->
              <div class="flex items-center justify-center rounded-lg font-display font-bold" :style="{ width: '32px', height: '32px', background: scanData.faviconBg, fontSize: '16px', color: '#fff' }">
                {{ scanData.favicon }}
              </div>
              <div>
                <div class="font-mono" style="font-size: 20px; color: #fff; margin-bottom: 2px;">
                  {{ scanData.host }}
                </div>
                <div style="font-size: 13px; color: var(--text-muted);">
                  Last scanned 12m ago ·
                  <a style="color: var(--brand); cursor: pointer;">View full report →</a>
                </div>
              </div>
              <span class="chip" style="margin-left: auto; border-color: rgba(0, 212, 170, 0.3); background: rgba(0, 212, 170, 0.1); color: var(--p-security);">
                <span class="pulse-dot" style="background: var(--p-security); color: var(--p-security);" />
                Monitoring on
              </span>
            </div>

            <!-- Pillar bars — 2-col grid -->
            <div class="grid gap-[10px_40px]" style="grid-template-columns: 1fr 1fr;">
              <div
                v-for="p in pillars.slice(0, 4)"
                :key="p.key"
                class="flex items-center gap-3"
              >
                <div class="font-display uppercase font-semibold" :style="{ fontSize: '11px', letterSpacing: '0.1em', color: p.color, width: '110px', flexShrink: 0 }">
                  {{ p.label }}
                </div>
                <div class="flex-1 h-[6px] rounded-full overflow-hidden" style="background: rgba(255,255,255,0.05);">
                  <div
                    class="h-full rounded-full"
                    :style="{
                      width: `${p.score}%`,
                      background: p.color,
                      boxShadow: `0 0 10px ${p.color}55`,
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }"
                  />
                </div>
                <div class="num font-display font-bold" style="font-size: 14px; color: #fff; text-align: right; width: 34px; flex-shrink: 0;">
                  {{ p.score }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-[10px]" style="min-width: 180px;">
            <button class="btn btn-pink-ghost" style="justify-content: center; height: 40px;">
              Rescan site
            </button>
            <button class="btn btn-ghost" style="justify-content: center; height: 40px;">
              See all 94 checks
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <div style="border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px;">
              <div class="font-display uppercase" style="font-size: 11px; color: var(--text-faint); letter-spacing: 0.15em; margin-bottom: 6px;">
                Potential uplift
              </div>
              <div class="num font-display font-bold" style="font-size: 28px; color: var(--p-security); line-height: 1;">
                +28 pts
              </div>
              <div style="font-size: 12px; color: var(--text-muted);">
                by fixing 3 quick wins
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ══ QUICK WINS ROW ════════════════════════════════════ -->
      <section>
        <div class="flex justify-between items-flex-end" style="margin-bottom: 16px;">
          <div>
            <div class="eyebrow">Quick wins · ranked by score impact</div>
            <h2 class="display" style="font-size: 28px; margin: 10px 0 0; letter-spacing: -0.02em;">
              Fix three things. Unlock 28 points.
            </h2>
          </div>
          <a style="color: var(--text-muted); font-size: 13px; cursor: pointer; font-family: var(--font-display);">
            Show all issues →
          </a>
        </div>

        <div class="grid gap-[18px]" style="grid-template-columns: repeat(3, 1fr);">
          <div
            v-for="(q, i) in quickWins"
            :key="i"
            class="card lift"
            style="padding: 24px 24px 22px; position: relative; border-left: 2px solid; cursor: pointer;"
            :style="{
              borderColor: (pillars.find(x => x.key === q.pillar) || pillars[0]).color,
              borderTopColor: 'var(--border)',
              borderRightColor: 'var(--border)',
              borderBottomColor: 'var(--border)',
            }"
            @mouseenter="qwHover($event, true, q)"
            @mouseleave="qwHover($event, false, q)"
          >
            <div class="card-accent-top" :style="{ background: `linear-gradient(to right, ${(pillars.find(x => x.key === q.pillar) || pillars[0]).color}, transparent)` }" />

            <div class="flex justify-between items-flex-start" style="margin-bottom: 16px;">
              <span class="eyebrow-pillar" :style="{ color: (pillars.find(x => x.key === q.pillar) || pillars[0]).color }">
                <span :style="{ width: '22px', height: '2px', background: (pillars.find(x => x.key === q.pillar) || pillars[0]).color, display: 'inline-block', marginRight: '6px' }" />
                {{ (pillars.find(x => x.key === q.pillar) || pillars[0]).label }}
              </span>
              <div style="text-align: right;">
                <div class="num font-display font-bold" :style="{ fontSize: '26px', color: 'var(--p-security)', lineHeight: 1 }">
                  +{{ q.impact }}
                </div>
                <div class="font-display uppercase" style="font-size: 10px; color: var(--text-muted); letter-spacing: 0.12em; margin-top: 3px;">
                  pts potential
                </div>
              </div>
            </div>

            <h3 class="display" :style="{ fontSize: '20px', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: '1.1' }">
              {{ q.title }}
            </h3>
            <p :style="{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 20px' }">
              {{ q.blurb }}
            </p>

            <button class="btn btn-pink-ghost" style="width: 100%; justify-content: center;">
              {{ q.toolLabel }}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- ══ TREND CHART + MONITOR PANEL ═══════════════════════ -->
      <div class="grid gap-[24px]" style="grid-template-columns: 1.4fr 1fr;">

        <!-- Trend Chart -->
        <div class="card" style="padding: 28px; position: relative; height: 340px;">
          <div class="card-accent-top" style="background: linear-gradient(to right, var(--brand), transparent);" />

          <div class="flex justify-between items-flex-start" style="margin-bottom: 24px;">
            <div>
              <div class="eyebrow">Score history · 12 weeks</div>
              <div class="flex items-baseline gap-[14px]" style="margin-top: 14px;">
                <div class="num font-display font-bold" style="font-size: 44px; letter-spacing: -0.05em; line-height: 0.9;">
                  {{ scanData.overall }}
                </div>
                <div class="font-display font-semibold" style="color: var(--p-security); font-size: 14px;">
                  +22 since start
                </div>
              </div>
            </div>
            <div class="flex gap-[14px] items-center">
              <div class="flex items-center gap-[8px] font-mono" style="font-size: 12px; color: var(--text-muted);">
                <span style="width: 12px; height: 2px; background: #ec3586; display: inline-block;" />
                acme.design
              </div>
              <div class="flex items-center gap-[8px] font-mono" style="font-size: 12px; color: var(--text-muted);">
                <span style="width: 12px; height: 2px; background: rgba(255,255,255,0.35); display: inline-block;" />
                proto.studio
              </div>
            </div>
          </div>

          <svg width="100%" :viewBox="`0 0 ${chartW} ${chartH}`" style="display: block;">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ec3586" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#ec3586" stop-opacity="0" />
              </linearGradient>
            </defs>
            <!-- grid lines -->
            <g v-for="v in [50, 60, 70, 80, 90]" :key="v">
              <line :x1="chartPad" :x2="chartW - chartPad" :y1="cy(v)" :y2="cy(v)" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2 4" />
              <text x="8" :y="cy(v) + 3" fill="rgba(255,255,255,0.3)" font-size="10" font-family="var(--font-mono)">{{ v }}</text>
            </g>
            <!-- proto (ghost) -->
            <path :d="linePath('proto')" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-dasharray="4 4" />
            <!-- acme area -->
            <path :d="areaPath" fill="url(#areaGrad)" />
            <!-- acme line -->
            <path :d="linePath('acme')" fill="none" stroke="#ec3586" stroke-width="2.2" />
            <!-- last point -->
            <circle :cx="cx(latestPt.x)" :cy="cy(latestPt.acme)" r="5" fill="#ec3586" />
            <circle :cx="cx(latestPt.x)" :cy="cy(latestPt.acme)" r="10" fill="#ec3586" opacity="0.2" />
          </svg>
        </div>

        <!-- Monitor Panel -->
        <div class="card" style="padding: 28px; position: relative; height: 340px; overflow: hidden;">
          <div class="card-accent-top" style="background: linear-gradient(to right, #74b9ff, transparent);" />

          <div class="flex justify-between items-center" style="margin-bottom: 18px;">
            <div>
              <div class="eyebrow">Monitoring</div>
              <div class="font-display font-semibold" style="font-size: 18px; margin-top: 12px;">Last 24 hours</div>
            </div>
            <span class="chip" style="border-color: rgba(0, 212, 170, 0.3); background: rgba(0, 212, 170, 0.1); color: var(--p-security);">
              <span class="pulse-dot" style="background: var(--p-security); color: var(--p-security);" />
              Live
            </span>
          </div>

          <div class="flex flex-col">
            <div
              v-for="(e, idx) in feedEvents"
              :key="idx"
              style="padding: 12px 0 12px 14px; border-left: 2px solid; border-bottom: 1px solid var(--border);"
              :style="{
                borderColor: e.status === 'crit' ? '#ff4757' : e.status === 'warn' ? '#ffaa00' : (pillars.find(x => x.key === e.pillar) || pillars[0]).color,
                borderBottomColor: idx < feedEvents.length - 1 ? 'var(--border)' : 'transparent',
                display: 'grid',
                gridTemplateColumns: '48px 1fr auto',
                gap: '12px',
                alignItems: 'center',
              }"
            >
              <span class="font-mono" style="font-size: 11px; color: var(--text-faint);">{{ e.when }}</span>
              <div>
                <div style="font-size: 13px; color: #fff;">
                  <span class="font-mono">{{ e.host }}</span>
                  <span style="color: var(--text-muted);"> · {{ e.msg }}</span>
                </div>
              </div>
              <!-- status icon -->
              <svg v-if="e.status === 'pass'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else-if="e.status === 'warn'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" stroke-width="2.5" stroke-linecap="round">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.5" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

      <!-- ══ RECENT SCANS TABLE ════════════════════════════════ -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <!-- table header -->
        <div style="padding: 20px 28px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
          <div>
            <div class="eyebrow">Recent scans</div>
          </div>
          <div class="flex gap-[8px]">
            <button class="btn btn-ghost" style="height: 32px; font-size: 12px; padding: 0 12px;">Filter</button>
            <button class="btn btn-ghost" style="height: 32px; font-size: 12px; padding: 0 12px;">Export CSV</button>
          </div>
        </div>

        <!-- column headers -->
        <div style="display: grid; grid-template-columns: 2.4fr 0.8fr 1.8fr 1fr 0.7fr; padding: 12px 28px; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-faint); font-family: var(--font-display); font-weight: 600; border-bottom: 1px solid var(--border);">
          <div>Site</div>
          <div>Score</div>
          <div>Pillars (SEC · PERF · SEO · A11Y · AI · DNS · TRUST)</div>
          <div>When</div>
          <div />
        </div>

        <!-- rows -->
        <div v-for="(r, i) in recentScans" :key="i">
          <div
            class="flex items-center"
            style="display: grid; grid-template-columns: 2.4fr 0.8fr 1.8fr 1fr 0.7fr; padding: 16px 28px; border-bottom: 1px solid var(--border); cursor: pointer;"
            :style="{ borderBottomColor: i < recentScans.length - 1 ? 'var(--border)' : 'transparent' }"
            @mouseenter="rsHover($event, true)"
            @mouseleave="rsHover($event, false)"
          >
            <!-- Site -->
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center rounded-lg font-display font-bold" :style="{ width: '28px', height: '28px', background: '#ec3586', fontSize: '13px', color: '#fff', flexShrink: 0 }">
                {{ r.host.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="font-mono" style="font-size: 14px; color: #fff;">{{ r.host }}</div>
                <div style="font-size: 11px; color: var(--text-faint); margin-top: 2px;">
                  <span v-if="r.delta.startsWith('+')" style="color: #00d4aa;">▲ {{ r.delta.slice(1) }}</span>
                  <span v-else style="color: #ff4757;">▼ {{ r.delta.slice(1) }}</span>
                  since last scan
                </div>
              </div>
            </div>

            <!-- Score chip -->
            <div>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded font-display font-bold border font-variant-numeric tabular-nums"
                :style="{
                  fontSize: '13px',
                  background: `${r.overall >= 85 ? '#00d4aa' : r.overall >= 65 ? '#ffaa00' : '#ff4757'}14`,
                  color: r.overall >= 85 ? '#00d4aa' : r.overall >= 65 ? '#ffaa00' : '#ff4757',
                  borderColor: `${r.overall >= 85 ? '#00d4aa' : r.overall >= 65 ? '#ffaa00' : '#ff4757'}30`,
                }"
              >
                {{ r.overall }}
              </span>
            </div>

            <!-- Pillar sparkline -->
            <div class="flex gap-[3px] items-end h-[28px]">
              <div
                v-for="(v, pi) in r.pillars"
                :key="pi"
                class="w-[4px] rounded-sm"
                :style="{
                  height: `${Math.max(4, v * 0.28)}px`,
                  background: pillars[pi]?.color ?? '#fff',
                  opacity: 0.85,
                }"
              />
            </div>

            <!-- When -->
            <div class="font-mono" style="font-size: 12px; color: var(--text-muted);">{{ r.when }}</div>

            <!-- Arrow -->
            <div style="text-align: right; color: var(--text-muted);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

    </div>
  </main>
</template>

<style scoped>
/* Dashboard-specific overrides — uses tokens.css vars */
.grid-bg {
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.018) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 64px 64px;
}

.ghost-numeral {
  position: absolute;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.06em;
  color: rgba(255, 255, 255, 0.04);
  pointer-events: none;
  user-select: none;
  line-height: 0.8;
}

.card-accent-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}

.lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.lift:hover {
  transform: translateY(-2px) scale(1.005);
}

.pulse-dot {
  width: 8px; height: 8px; border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
  position: relative;
}
.pulse-dot::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0;
  animation: pulsering 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes pulsering {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}

/* Reduced-motion overrides */
@media (prefers-reduced-motion: reduce) {
  .pulse-dot,
  .pulse-dot::after {
    animation: none;
  }
  .lift {
    transition: none;
  }
  .lift:hover {
    transform: none;
  }
}
</style>