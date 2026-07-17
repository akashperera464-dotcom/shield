import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Only process the project's own source — prevents Vite from scanning
  // unrelated reference HTML files in /skills that import packages we
  // don't ship (e.g. `three`).
  server: {
    port: 5173,
    open: false,
    host: true,
    fs: {
      // Restrict file serving to the project root only.
      allow: ['/home/z/my-project'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // Don't treat any HTML outside index.html as an entry point.
  optimizeDeps: {
    exclude: ['three'],
  },
})
