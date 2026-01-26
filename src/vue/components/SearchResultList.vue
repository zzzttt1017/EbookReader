<script setup lang="ts">
import type { SearchResult } from '../../core/types'

defineProps<{
  results: SearchResult[]
}>()

const emit = defineEmits<{
  (e: 'select', cfi: string): void
}>()
</script>

<template>
  <ul class="ebook-reader__search-list">
    <li v-for="(r, idx) in results" :key="`${r.cfi ?? 'no-cfi'}-${idx}`" class="ebook-reader__search-item">
      <button
        type="button"
        class="ebook-reader__search-btn"
        @click="r.cfi && emit('select', r.cfi)"
      >
        <div v-if="r.label" class="ebook-reader__search-label">{{ r.label }}</div>
        <div class="ebook-reader__search-excerpt">
          {{ typeof r.excerpt === 'string' ? r.excerpt : `${r.excerpt?.pre ?? ''}${r.excerpt?.match ?? ''}${r.excerpt?.post ?? ''}` }}
        </div>
      </button>
    </li>
  </ul>
</template>
