import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@somecat/epub-reader/style.css': path.resolve(__dirname, '../../src/styles/epub-reader.css'),
      '@somecat/epub-reader/vue': path.resolve(__dirname, '../../src/vue/index.ts'),
      '@somecat/epub-reader': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
})

