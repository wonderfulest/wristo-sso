import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const sharedEnvDir = fileURLToPath(new URL('..', import.meta.url))
  const envDir = fileURLToPath(new URL(mode === 'prod' || mode === 'production' || mode === 'cn' ? '.' : '..', import.meta.url))
  const env = { ...loadEnv(mode, sharedEnvDir, ''), ...loadEnv(mode, envDir, '') }

  return {
    envDir,
    define: {
      'import.meta.env.VITE_WRISTO_REGION': JSON.stringify(mode === 'cn' ? 'cn' : env.VITE_WRISTO_REGION || ''),
      'import.meta.env.VITE_WRISTO_DEFAULT_SSO_REDIRECT_URI': JSON.stringify(env.VITE_WRISTO_DEFAULT_SSO_REDIRECT_URI || ''),
      'import.meta.env.VITE_WRISTO_GOOGLE_OAUTH_REDIRECT_URI': JSON.stringify(env.VITE_WRISTO_GOOGLE_OAUTH_REDIRECT_URI || ''),
      'import.meta.env.VITE_WRISTO_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_WRISTO_GOOGLE_CLIENT_ID || ''),
      'import.meta.env.VITE_WRISTO_APPLE_CLIENT_ID': JSON.stringify(env.VITE_WRISTO_APPLE_CLIENT_ID || ''),
      'import.meta.env.VITE_WRISTO_APPLE_REDIRECT_URI': JSON.stringify(env.VITE_WRISTO_APPLE_REDIRECT_URI || ''),
    },
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
      port: 3001,
      strictPort: true,
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
  }
})
