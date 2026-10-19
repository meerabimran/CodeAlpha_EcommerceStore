import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    base: mode === 'production' ? '/CodeAlpha_EcommerceStore/' : '/',
    plugins: [react()],
    server: {
      proxy: {
        '/api': env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
      },
    },
  }
})
