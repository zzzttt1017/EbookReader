<script setup lang="ts">
import type { TocItem } from '../../core/types'
import TocTree from './TocTree.vue'

defineProps<{
  isOpen: boolean
  toc: TocItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', href?: string): void
}>()
</script>

<template>
  <aside :class="['ebook-reader__drawer', { 'is-open': isOpen }]" :aria-hidden="!isOpen">
    <div class="ebook-reader__drawer-header">
      <div class="ebook-reader__drawer-title">目录</div>
      <button type="button" class="ebook-reader__btn" @click="emit('close')">
        关闭
      </button>
    </div>
    <div class="ebook-reader__drawer-body">
      <TocTree
        v-if="toc.length"
        :items="toc"
        @select="(href) => {
          emit('select', href)
          emit('close')
        }"
      />
      <div v-else class="ebook-reader__empty">未找到目录</div>
    </div>
  </aside>
</template>
