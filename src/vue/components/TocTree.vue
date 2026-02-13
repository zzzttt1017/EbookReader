<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import type { TocItem } from '../../core/types'
import SvgIcon from './SvgIcon.vue'

const props = defineProps<{
  items: TocItem[]
  activeHref?: string
}>()

const { items, activeHref } = toRefs(props)

const emit = defineEmits<{
  (e: 'select', href?: string): void
}>()

const normalizeHref = (href?: string) => (href ?? '').split('#')[0]

const hasExact = (list: TocItem[], href: string): boolean =>
  list.some((it) => it.href === href || (it.subitems?.length ? hasExact(it.subitems, href) : false))

const matchMode = computed<'exact' | 'base'>(() => {
  if (!activeHref.value) return 'base'
  return hasExact(items.value, activeHref.value) ? 'exact' : 'base'
})

const isHrefMatch = (itemHref?: string) => {
  if (!activeHref.value || !itemHref) return false
  if (matchMode.value === 'exact') return itemHref === activeHref.value
  return normalizeHref(itemHref) === normalizeHref(activeHref.value)
}

const containsActive = (item: TocItem): boolean => {
  if (isHrefMatch(item.href)) return true
  if (!item.subitems?.length) return false
  return item.subitems.some(containsActive)
}

const rootRef = ref<HTMLElement | null>(null)

watch(
  [activeHref, items],
  async () => {
    if (!activeHref.value) return
    await nextTick()

    requestAnimationFrame(() => {
      const el = rootRef.value?.querySelector('[data-epub-toc-active="true"]')
      if (!(el instanceof HTMLElement)) return

      const container = el.closest<HTMLElement>('.epub-reader__drawer-body, .epub-reader__msheet-body')
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      if (containerRect.height <= 0) return

      const elRect = el.getBoundingClientRect()
      const topDelta = elRect.top - containerRect.top
      const target = container.scrollTop + topDelta - container.clientHeight / 2 + elRect.height / 2
      const nextTop = Math.max(0, Math.min(target, container.scrollHeight - container.clientHeight))
      container.scrollTop = nextTop
    })
  },
  { immediate: true },
)
</script>

<template>
  <ul ref="rootRef" class="epub-reader__toc-list">
    <li v-for="(item, idx) in items" :key="item.href || `${item.label ?? 'item'}-${idx}`" class="epub-reader__toc-item">
      <template v-if="!item.subitems?.length">
        <button
          type="button"
          :class="['epub-reader__toc-btn', { 'is-active': isHrefMatch(item.href) }]"
          :aria-current="isHrefMatch(item.href) ? 'location' : undefined"
          :data-epub-toc-active="isHrefMatch(item.href) ? 'true' : undefined"
          @click="emit('select', item.href)"
        >
          <span class="epub-reader__toc-label">{{ item.label || item.href || '未命名' }}</span>
          <SvgIcon v-if="isHrefMatch(item.href)" name="book-open" class="epub-reader__toc-active-icon" />
        </button>
      </template>
      <template v-else>
        <details :class="['epub-reader__toc-details', { 'is-active': containsActive(item) }]" :open="containsActive(item) ? true : undefined">
          <summary :class="['epub-reader__toc-summary', { 'is-active': containsActive(item) }]">{{ item.label || item.href || '未命名' }}</summary>
          <TocTree :items="item.subitems" :active-href="activeHref" @select="emit('select', $event)" />
        </details>
      </template>
    </li>
  </ul>
</template>
