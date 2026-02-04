<script setup lang="ts">
import type { SearchOptions, SearchResult } from '../../core/types'
import SearchResultList from './SearchResultList.vue'
import SvgIcon from './SvgIcon.vue'

defineProps<{
  isOpen: boolean
  status: 'idle' | 'ready' | 'opening' | 'error'
  query: string
  options: SearchOptions
  progressPercent: number
  searching: boolean
  results: SearchResult[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'search', query: string): void
  (e: 'update:query', val: string): void
  (e: 'update:options', val: Partial<SearchOptions>): void
  (e: 'cancelSearch'): void
  (e: 'selectResult', cfi: string): void
}>()

const updateOption = (key: keyof SearchOptions, value: boolean) => {
  emit('update:options', { [key]: value })
}
</script>

<template>
  <aside :class="['ebook-reader__drawer', 'right', { 'is-open': isOpen }]" :aria-hidden="!isOpen">
    <div class="ebook-reader__drawer-header">
      <div class="ebook-reader__drawer-title">搜索</div>
      <button type="button" class="ebook-reader__btn" @click="emit('close')">
        <SvgIcon name="x" />
      </button>
    </div>
    <div class="ebook-reader__drawer-body">
      <div class="ebook-reader__field">
        <input
          class="ebook-reader__input"
          placeholder="输入关键词"
          :value="query"
          :disabled="status !== 'ready'"
          @input="(e: any) => {
            const v = e.target.value
            emit('update:query', v)
            if (!v.trim()) emit('search', '')
          }"
          @keydown.enter="emit('search', query)"
        />
        <button type="button" class="ebook-reader__btn" :disabled="status !== 'ready'" @click="emit('search', query)">
          <SvgIcon name="search" />
        </button>
      </div>

      <div class="ebook-reader__checks">
        <label class="ebook-reader__check">
          <input
            type="checkbox"
            :checked="Boolean(options.matchCase)"
            @change="(e: any) => updateOption('matchCase', e.target.checked)"
          />
          区分大小写
        </label>
        <label class="ebook-reader__check">
          <input
            type="checkbox"
            :checked="Boolean(options.wholeWords)"
            @change="(e: any) => updateOption('wholeWords', e.target.checked)"
          />
          全词匹配
        </label>
        <label class="ebook-reader__check">
          <input
            type="checkbox"
            :checked="Boolean(options.matchDiacritics)"
            @change="(e: any) => updateOption('matchDiacritics', e.target.checked)"
          />
          区分变音
        </label>
      </div>

      <div class="ebook-reader__meta">
        <span>进度 {{ progressPercent }}%</span>
        <span v-if="searching">搜索中…</span>
        <button v-if="searching" type="button" class="ebook-reader__link" @click="emit('cancelSearch')">
          取消
        </button>
      </div>

      <SearchResultList v-if="results.length" :results="results" @select="(cfi) => emit('selectResult', cfi)" />
      <div v-else class="ebook-reader__empty">{{ query.trim() ? '无匹配结果' : '请输入关键词' }}</div>
    </div>
  </aside>
</template>
