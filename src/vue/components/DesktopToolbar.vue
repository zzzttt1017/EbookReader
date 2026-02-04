<script setup lang="ts">
import SvgIcon from './SvgIcon.vue'

defineProps<{
  darkMode: boolean
  fontSize: number
}>()

const emit = defineEmits<{
  (e: 'toggleToc'): void
  (e: 'toggleSearch'): void
  (e: 'prevSection'): void
  (e: 'prevPage'): void
  (e: 'nextPage'): void
  (e: 'nextSection'): void
  (e: 'toggleDarkMode'): void
  (e: 'changeFontSize', val: number): void
}>()
</script>

<template>
  <div class="ebook-reader__toolbar">
    <div class="ebook-reader__panel">
      <button type="button" class="ebook-reader__btn" title="目录" @click="emit('toggleToc')">
        <SvgIcon name="list" />
      </button>
      <button type="button" class="ebook-reader__btn" title="搜索" @click="emit('toggleSearch')">
        <SvgIcon name="search" />
      </button>
      <div class="ebook-reader__divider" />
      <button type="button" class="ebook-reader__btn" title="上一章" @click="emit('prevSection')">
        <SvgIcon name="chevrons-left" />
      </button>
      <button type="button" class="ebook-reader__btn" title="上一页" @click="emit('prevPage')">
        <SvgIcon name="chevron-left" />
      </button>
      <button type="button" class="ebook-reader__btn" title="下一页" @click="emit('nextPage')">
        <SvgIcon name="chevron-right" />
      </button>
      <button type="button" class="ebook-reader__btn" title="下一章" @click="emit('nextSection')">
        <SvgIcon name="chevrons-right" />
      </button>
    </div>

    <div class="ebook-reader__panel">
      <button type="button" class="ebook-reader__btn" title="主题" @click="emit('toggleDarkMode')">
        <SvgIcon :name="darkMode ? 'sun' : 'moon'" />
      </button>
      <div class="ebook-reader__divider" />
      <button type="button" class="ebook-reader__btn" title="增大字号" @click="emit('changeFontSize', fontSize + 10)">
        <SvgIcon name="plus" />
      </button>
      <div class="ebook-reader__font">{{ fontSize }}%</div>
      <button type="button" class="ebook-reader__btn" title="减小字号" @click="emit('changeFontSize', fontSize - 10)">
        <SvgIcon name="minus" />
      </button>
    </div>
  </div>
</template>
