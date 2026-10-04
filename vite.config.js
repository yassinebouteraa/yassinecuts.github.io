import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed at the domain root (yassinecuts.live), so base stays '/'.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['motion'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
