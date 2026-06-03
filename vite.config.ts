import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000'
  const wsBaseUrl = env.VITE_WS_BASE_URL || 'ws://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/scenarios': { target: apiBaseUrl, changeOrigin: true },
        '/conversations': { target: apiBaseUrl, changeOrigin: true },
        '/health': { target: apiBaseUrl, changeOrigin: true },
        '/ws': { target: wsBaseUrl, changeOrigin: true, ws: true },
      },
    },
  }
})
