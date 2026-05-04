import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sampa-electro.png', 'sampa-electro-maskable.png'],
      manifest: {
        name: 'Dudukan',
        short_name: 'Dudukan',
        description: 'L\'assistant intelligent qui vous aide à mieux gérer votre salaire.',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          {
            src: 'sampa-electro.png?v=3',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'sampa-electro.png?v=3',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'sampa-electro-maskable.png?v=3',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
