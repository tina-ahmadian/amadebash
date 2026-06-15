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
      '/apis/rescue-link': {
        target: 'https://rohamprojects.ir',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
