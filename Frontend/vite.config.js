import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // allowedHosts removed for production - not needed for Vercel deployment
  },
  
  // Strip console and debugger statements in production
  oxc: {
    drop: ['console', 'debugger'],
  },
  
  // Production build configuration
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for security
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('firebase/')) {
              return 'firebase-vendor';
            }
            if (id.includes('react-icons/')) {
              return 'icons-vendor';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000kb
  },
  
  // Preview server configuration (npm run preview)
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  },
})
