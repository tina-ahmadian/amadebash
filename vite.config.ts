import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/web-apps/rescue-link/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://87.107.174.39',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
});
