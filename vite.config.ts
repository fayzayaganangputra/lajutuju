import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Ganti 'repo-name' dengan nama repository GitHub-mu
export default defineConfig({
  base: '/lajutuju/', // <- ini penting untuk GitHub Pages
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173, // optional, default Vite
  },
});
