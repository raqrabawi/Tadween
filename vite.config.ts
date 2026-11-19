import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://<user>.github.io/nook/ by default; override with BASE_PATH for other hosts.
const base = process.env.BASE_PATH ?? '/nook/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Nook — just say it',
        short_name: 'Nook',
        description: 'Voice-first calendar, lists, family groceries and journal.',
        theme_color: '#0F181D',
        background_color: '#0F181D',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { navigateFallback: base + 'index.html', globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] }
    })
  ]
})
