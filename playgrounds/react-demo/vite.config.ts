import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@somecat/epub-reader/style.css': path.resolve(__dirname, '../../src/styles/epub-reader.css'),
      '@somecat/epub-reader/react': path.resolve(__dirname, '../../src/react/index.ts'),
      '@somecat/epub-reader': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 3001,
    strictPort: false,
  },
})

