import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts}',
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ec3586',
        'primary-hover': '#d42e77',
        dark: '#07070a',
        'dark-surface': '#0f0f14',
        'dark-elevated': '#16161e',
        'dark-border': 'rgba(255,255,255,0.07)',
        security: '#00d4aa',
        performance: '#ffaa00',
        seo: '#6c5ce7',
        success: '#00d4aa',
        warning: '#ffaa00',
        danger: '#ff4757',
        muted: 'rgba(255,255,255,0.45)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(236,53,134,0.35)',
        'glow-success': '0 0 20px rgba(0,212,170,0.35)',
        'glow-warning': '0 0 20px rgba(255,170,0,0.35)',
        'glow-danger': '0 0 20px rgba(255,71,87,0.35)',
        'elevation-sm': '0 2px 8px rgba(0,0,0,0.4)',
        'elevation-md': '0 4px 16px rgba(0,0,0,0.5)',
        'elevation-lg': '0 8px 32px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
} satisfies Config
