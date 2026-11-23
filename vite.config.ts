import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Relative paths, so the app works at any address: /Tadween/, /tadween/, a custom domain or localhost.
// Override with BASE_PATH only if a host needs an absolute path.
const base = process.env.BASE_PATH ?? './'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['icon.svg', 'google.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tadween — just say it',
        short_name: 'Tadween',
        description: 'Voice-first calendar, lists, family groceries and notes.',
        theme_color: '#F5F4ED',
        background_color: '#F5F4ED',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      // Fonts are cached the first time they're used, not all 50+ files up front
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [{
          urlPattern: ({ request }) => request.destination === 'font',
          handler: 'CacheFirst',
          options: { cacheName: 'tadween-fonts', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 } }
        }]
      }
    })
  ]
})
