import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'GPS Vivo',
        short_name: 'GPS Vivo',
        description: 'Monitoreo GPS en tiempo real para la familia',
        theme_color: '#0f172a',
        background_color: '#1e1e2f',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/854/854866.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
