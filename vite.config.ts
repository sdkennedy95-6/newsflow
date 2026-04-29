import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/feedly': {
        target: 'https://cloud.feedly.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/feedly/, '/v3'),
      },
    },
  },
})
