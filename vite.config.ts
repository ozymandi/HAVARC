import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from main.tsx so update checks can run on every return to the app.
      injectRegister: false,
      manifest: {
        name: "HAV'ARC Field Service",
        short_name: "HAV'ARC",
        description: 'Field service work orders, reports and invoices for HVAC technicians.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: '/icons/icon_192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon_512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,png}'],
      },
    }),
  ],
})
