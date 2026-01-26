<script setup lang="ts">
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
        目录
      </button>
      <button type="button" class="ebook-reader__btn" title="搜索" @click="emit('toggleSearch')">
        搜索
      </button>
      <div class="ebook-reader__divider" />
      <button type="button" class="ebook-reader__btn" title="上一章" @click="emit('prevSection')">
        上一章
      </button>
      <button type="button" class="ebook-reader__btn" title="上一页" @click="emit('prevPage')">
        上一页
      </button>
      <button type="button" class="ebook-reader__btn" title="下一页" @click="emit('nextPage')">
        下一页
      </button>
      <button type="button" class="ebook-reader__btn" title="下一章" @click="emit('nextSection')">
        下一章
      </button>
    </div>

    <div class="ebook-reader__panel">
      <button type="button" class="ebook-reader__btn" title="主题" @click="emit('toggleDarkMode')">
        {{ darkMode ? '亮色' : '暗黑' }}
      </button>
      <div class="ebook-reader__divider" />
      <button type="button" class="ebook-reader__btn" title="增大字号" @click="emit('changeFontSize', fontSize + 10)">
        A+
      </button>
      <div class="ebook-reader__font">{{ fontSize }}%</div>
      <button type="button" class="ebook-reader__btn" title="减小字号" @click="emit('changeFontSize', fontSize - 10)">
        A-
      </button>
    </div>
  </div>
</template>
