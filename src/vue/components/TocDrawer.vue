<script setup lang="ts">
import type { TocItem } from '../../core/types'
import TocTree from './TocTree.vue'
import SvgIcon from './SvgIcon.vue'

defineProps<{
  isOpen: boolean
  toc: TocItem[]
  activeTocHref?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', href?: string): void
}>()
</script>

<template>
  <aside :class="['epub-reader__drawer', { 'is-open': isOpen }]" :aria-hidden="!isOpen">
    <div class="epub-reader__drawer-header">
      <div class="epub-reader__drawer-title">目录</div>
      <button type="button" class="epub-reader__btn" @click="emit('close')">
        <SvgIcon name="x" />
      </button>
    </div>
    <div class="epub-reader__drawer-body">
      <TocTree
        v-if="toc.length"
        :items="toc"
        :active-href="activeTocHref"
        @select="(href) => {
          emit('select', href)
          emit('close')
        }"
      />
      <div v-else class="epub-reader__empty">未找到目录</div>
    </div>
  </aside>
</template>
