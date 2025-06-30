import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  base: '/', // Ensure base URL is set to root
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // 监听所有地址
    port: 3006,
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:8088',
        // target:  'https://api.wristo.io',
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      }
    },
  },
})
