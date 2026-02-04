<script setup lang="ts">
import { computed } from 'vue'
import { icons } from '../../core/icons'

const props = withDefaults(defineProps<{
  name: string
  size?: number | string
  color?: string
}>(), {
  size: 24,
  color: 'currentColor'
})

const iconPath = computed(() => icons[props.name] || '')

const iconStyle = computed(() => {
  const sizeVal = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: sizeVal,
    height: sizeVal,
    color: props.color,
    minWidth: sizeVal // 防止在 flex 布局中被压缩
  }
})
</script>

<template>
  <svg
    v-if="iconPath"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    :style="iconStyle"
    class="ebook-reader-icon"
    v-html="iconPath"
  >
  </svg>
</template>

<style scoped>
.ebook-reader-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
