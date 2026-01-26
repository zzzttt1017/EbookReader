import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@somecat/ebook-reader/style.css': path.resolve(__dirname, '../../src/styles/ebook-reader.css'),
      '@somecat/ebook-reader/react': path.resolve(__dirname, '../../src/react/index.ts'),
      '@somecat/ebook-reader': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 3001,
    strictPort: false,
  },
})

