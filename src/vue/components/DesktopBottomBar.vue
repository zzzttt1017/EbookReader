<script setup lang="ts">
defineProps<{
  status: 'idle' | 'ready' | 'opening' | 'error'
  errorText: string
  sectionLabel: string
  displayedPercent: number
}>()

const emit = defineEmits<{
  (e: 'seekStart'): void
  (e: 'seekChange', val: number): void
  (e: 'seekEnd', val: number): void
  (e: 'seekCommit', val: number): void
}>()
</script>

<template>
  <div class="epub-reader__bottom">
    <div class="epub-reader__bottom-left">
      <span class="epub-reader__status">
        {{ status === 'error' ? errorText || '错误' : status === 'opening' ? '正在打开…' : '就绪' }}
      </span>
      <span v-if="sectionLabel" class="epub-reader__section">{{ sectionLabel }}</span>
    </div>
    <div class="epub-reader__bottom-right">
      <input
        class="epub-reader__range"
        type="range"
        :min="0"
        :max="100"
        :step="1"
        :value="displayedPercent"
        @input="(e: any) => {
          emit('seekStart')
          emit('seekChange', Number(e.target.value))
        }"
        @pointerup="(e: any) => emit('seekEnd', Number(e.target.value))"
        @keyup.enter="(e: any) => emit('seekCommit', Number(e.target.value))"
      />
      <span class="epub-reader__percent">{{ displayedPercent }}%</span>
    </div>
  </div>
</template>
