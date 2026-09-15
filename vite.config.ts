import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('1.1.5'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/logo.png', 'assets/logo.ico'],
      manifest: {
        name: 'Imagine • Batch Multi-Prompt Studio',
        short_name: 'Imagine',
        description: 'Multi-Prompt Image Batch Editor powered by Boogu-Image-0.1-Edit-Turbo 1.5K',
        theme_color: '#0d0d0d',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'assets/logo.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
