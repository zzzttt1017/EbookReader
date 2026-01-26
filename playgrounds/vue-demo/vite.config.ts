import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@somecat/ebook-reader/style.css': path.resolve(__dirname, '../../src/styles/ebook-reader.css'),
      '@somecat/ebook-reader/vue': path.resolve(__dirname, '../../src/vue/index.ts'),
      '@somecat/ebook-reader': path.resolve(__dirname, '../../src/index.ts'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
})

