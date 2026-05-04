import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sampa-electro.png'],
      manifest: {
        name: 'Dudukan',
        short_name: 'Dudukan',
        description: 'L\'assistant intelligent qui vous aide à mieux gérer votre salaire.',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          {
            src: 'sampa-electro.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'sampa-electro.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
