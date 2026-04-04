<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Settings — ScanPulse' })

type Tab = 'profile' | 'billing' | 'notifications' | 'developer' | 'danger'

const activeTab = ref<Tab>('profile')

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: 'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z' },
  { id: 'billing',       label: 'Billing',       icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' },
  { id: 'notifications', label: 'Notifications', icon: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
  { id: 'developer',    label: 'Developer',     icon: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z' },
  { id: 'danger',       label: 'Danger Zone',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
]
</script>

<template>
  <div class="min-h-screen bg-dark pt-[62px]">

    <!-- Page grid -->
    <div class="max-w-[1100px] mx-auto px-6 md:px-10 xl:px-0 py-12 flex gap-8 md:gap-12 items-start">

      <!-- ── Sidebar (desktop) / Horizontal tabs (mobile) ── -->
      <aside class="shrink-0 w-full md:w-[220px]">

        <!-- Header -->
        <div class="hidden md:block mb-8">
          <p class="font-display font-bold text-white tracking-[-0.03em]" style="font-size:1.35rem">Settings</p>
          <p class="font-body text-white/30 text-[13px] mt-1">Manage your account</p>
        </div>

        <!-- Nav list (desktop vertical) -->
        <nav class="hidden md:flex flex-col gap-0.5">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="sidebar-tab"
            :class="{ 'sidebar-tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="shrink-0 opacity-60" :class="{ 'opacity-100': activeTab === tab.id }">
              <path :d="tab.icon" />
            </svg>
            <span>{{ tab.label }}</span>
          </button>
        </nav>

        <!-- Nav list (mobile horizontal) -->
        <nav class="md:hidden flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="mobile-tab"
            :class="{ 'mobile-tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </aside>

      <!-- ── Content panel ── -->
      <main class="flex-1 min-w-0">

        <!-- Mobile heading -->
        <div class="md:hidden mb-6">
          <p class="font-display font-bold text-white tracking-[-0.03em]" style="font-size:1.35rem">Settings</p>
        </div>

        <!-- Profile tab -->
        <section v-if="activeTab === 'profile'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>PROFILE</span>
            </div>
            <h2 class="settings-heading">Your profile</h2>
            <p class="settings-subtext">Manage your name, email, password, and profile picture via Clerk.</p>
            <div class="mt-8 p-6 rounded-xl border border-white/[0.06] bg-dark-elevated text-white/40 font-body text-sm text-center">
              Profile component coming in Task 2
            </div>
          </div>
        </section>

        <!-- Billing tab -->
        <section v-else-if="activeTab === 'billing'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>BILLING</span>
            </div>
            <h2 class="settings-heading">Billing &amp; Usage</h2>
            <p class="settings-subtext">Manage your plan, usage, and subscription.</p>
            <div class="mt-8 p-6 rounded-xl border border-white/[0.06] bg-dark-elevated text-white/40 font-body text-sm text-center">
              Billing component coming in Task 3
            </div>
          </div>
        </section>

        <!-- Notifications tab -->
        <section v-else-if="activeTab === 'notifications'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>NOTIFICATIONS</span>
            </div>
            <h2 class="settings-heading">Email alerts</h2>
            <p class="settings-subtext">Get notified when your site's score drops below a threshold.</p>
            <div class="mt-8 p-6 rounded-xl border border-white/[0.06] bg-dark-elevated text-white/40 font-body text-sm text-center">
              Notifications component coming in Task 4
            </div>
          </div>
        </section>

        <!-- Developer tab -->
        <section v-else-if="activeTab === 'developer'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px bg-primary" />
              <span>DEVELOPER</span>
            </div>
            <h2 class="settings-heading">API access</h2>
            <p class="settings-subtext">Generate and manage API keys to integrate ScanPulse into your workflow.</p>
            <div class="mt-8 p-6 rounded-xl border border-white/[0.06] bg-dark-elevated text-white/40 font-body text-sm text-center">
              API keys component coming in Task 6
            </div>
          </div>
        </section>

        <!-- Danger Zone tab -->
        <section v-else-if="activeTab === 'danger'">
          <div class="settings-panel">
            <div class="settings-eyebrow">
              <div class="w-5 h-px" style="background:#ff4757" />
              <span style="color:#ff4757">DANGER ZONE</span>
            </div>
            <h2 class="settings-heading">Account deletion</h2>
            <p class="settings-subtext">Permanently delete your account and all associated data.</p>
            <div class="mt-8 p-6 rounded-xl border border-danger/20 bg-dark-elevated text-white/40 font-body text-sm text-center">
              Danger zone component coming in Task 7
            </div>
          </div>
        </section>

      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Sidebar tab (desktop) ───────────────────────────── */
.sidebar-tab {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s ease, background 0.15s ease;
}
.sidebar-tab:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.04);
}
.sidebar-tab--active {
  color: #ec3586;
  background: rgba(236, 53, 134, 0.08);
}
.sidebar-tab--active svg {
  opacity: 1;
  color: #ec3586;
}

/* ── Mobile tabs ──────────────────────────────────────── */
.mobile-tab {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}
.mobile-tab:hover {
  color: rgba(255, 255, 255, 0.7);
}
.mobile-tab--active {
  color: #ec3586;
  background: rgba(236, 53, 134, 0.1);
  border-color: rgba(236, 53, 134, 0.25);
}

/* ── Panel typography ─────────────────────────────────── */
.settings-panel {
  padding: 0;
}
.settings-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.settings-eyebrow span {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: #ec3586;
  text-transform: uppercase;
}
.settings-heading {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  color: white;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 10px;
}
.settings-subtext {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}
</style>
