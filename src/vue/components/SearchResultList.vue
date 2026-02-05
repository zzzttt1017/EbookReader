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
  <ul class="epub-reader__search-list">
    <li v-for="(r, idx) in results" :key="`${r.cfi ?? 'no-cfi'}-${idx}`" class="epub-reader__search-item">
      <button
        type="button"
        class="epub-reader__search-btn"
        @click="r.cfi && emit('select', r.cfi)"
      >
        <div v-if="r.label" class="epub-reader__search-label">{{ r.label }}</div>
        <div class="epub-reader__search-excerpt">
          {{ typeof r.excerpt === 'string' ? r.excerpt : `${r.excerpt?.pre ?? ''}${r.excerpt?.match ?? ''}${r.excerpt?.post ?? ''}` }}
        </div>
      </button>
    </li>
  </ul>
</template>
