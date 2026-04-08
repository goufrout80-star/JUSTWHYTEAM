import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
          if (id.includes('src/pages/AdminPanel') ||
              id.includes('src/components/admin/')) {
            return 'chunk-admin';
          }
          if (id.includes('src/pages/Login') ||
              id.includes('src/pages/Register') ||
              id.includes('src/pages/ForgotPassword') ||
              id.includes('src/pages/ResetPassword') ||
              id.includes('src/pages/VerifyTwoFA')) {
            return 'chunk-auth';
          }
        }
      }
    }
  }
})
