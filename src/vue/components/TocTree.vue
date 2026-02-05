<script setup lang="ts">
import type { TocItem } from '../../core/types'

defineProps<{
  items: TocItem[]
}>()

const emit = defineEmits<{
  (e: 'select', href?: string): void
}>()
</script>

<template>
  <ul class="epub-reader__toc-list">
    <li v-for="(item, idx) in items" :key="item.href || `${item.label ?? 'item'}-${idx}`" class="epub-reader__toc-item">
      <template v-if="!item.subitems?.length">
        <button type="button" class="epub-reader__toc-btn" @click="emit('select', item.href)">
          {{ item.label || item.href || '未命名' }}
        </button>
      </template>
      <template v-else>
        <details class="epub-reader__toc-details">
          <summary class="epub-reader__toc-summary">{{ item.label || item.href || '未命名' }}</summary>
          <TocTree :items="item.subitems" @select="emit('select', $event)" />
        </details>
      </template>
    </li>
  </ul>
</template>
