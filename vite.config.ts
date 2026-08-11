import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH allows deploying under a sub-path (e.g. GitHub Pages: /the-game/)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
