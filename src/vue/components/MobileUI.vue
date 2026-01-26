<script setup lang="ts">
import { computed } from 'vue'
import type { TocItem, SearchOptions, SearchResult } from '../../core/types'
import TocTree from './TocTree.vue'
import SearchResultList from './SearchResultList.vue'
import type { MobilePanel } from '../types'

const props = defineProps<{
  barVisible: boolean
  activePanel: MobilePanel | null
  
  // Data
  toc: TocItem[]
  status: 'idle' | 'ready' | 'opening' | 'error'
  errorText: string
  sectionLabel: string
  displayedPercent: number
  darkMode: boolean
  fontSize: number
  
  // Search Data
  searchQuery: string
  searchOptions: SearchOptions
  searchProgressPercent: number
  searching: boolean
  searchResults: SearchResult[]
}>()

const emit = defineEmits<{
  (e: 'togglePanel', panel: MobilePanel): void
  (e: 'closePanel'): void
  
  (e: 'tocSelect', href?: string): void
  
  (e: 'search', query: string): void
  (e: 'update:searchQuery', val: string): void
  (e: 'update:searchOptions', val: Partial<SearchOptions>): void
  (e: 'cancelSearch'): void
  (e: 'searchResultSelect', cfi: string): void
  
  (e: 'seekStart'): void
  (e: 'seekChange', val: number): void
  (e: 'seekEnd', val: number): void
  (e: 'seekCommit', val: number): void
  
  (e: 'toggleDarkMode', val: boolean): void
  (e: 'changeFontSize', val: number): void
}>()

const mobileTitle = computed(() => {
  switch (props.activePanel) {
    case 'menu': return '目录'
    case 'search': return '搜索'
    case 'progress': return '进度'
    case 'theme': return '明暗'
    case 'font': return '字号'
    default: return ''
  }
})

const updateSearchOption = (key: keyof SearchOptions, value: boolean) => {
  emit('update:searchOptions', { [key]: value })
}
</script>

<template>
  <div>
    <div :class="['ebook-reader__mbar', { 'is-visible': barVisible }]">
      <button type="button" class="ebook-reader__btn" :aria-pressed="activePanel === 'menu'" @click="emit('togglePanel', 'menu')">
        目录
      </button>
      <button type="button" class="ebook-reader__btn" :aria-pressed="activePanel === 'search'" @click="emit('togglePanel', 'search')">
        搜索
      </button>
      <button type="button" class="ebook-reader__btn" :aria-pressed="activePanel === 'progress'" @click="emit('togglePanel', 'progress')">
        进度
      </button>
      <button type="button" class="ebook-reader__btn" :aria-pressed="activePanel === 'theme'" @click="emit('togglePanel', 'theme')">
        明暗
      </button>
      <button type="button" class="ebook-reader__btn" :aria-pressed="activePanel === 'font'" @click="emit('togglePanel', 'font')">
        字号
      </button>
    </div>

    <div v-if="activePanel" class="ebook-reader__moverlay" @click="emit('closePanel')" />

    <div :class="['ebook-reader__msheet', { 'is-open': activePanel }]" :aria-hidden="!activePanel">
      <div class="ebook-reader__msheet-header">
        <div class="ebook-reader__msheet-title">{{ mobileTitle }}</div>
        <button type="button" class="ebook-reader__btn" @click="emit('closePanel')">
          关闭
        </button>
      </div>
      <div class="ebook-reader__msheet-body">
        <template v-if="activePanel === 'menu'">
          <TocTree
            v-if="toc.length"
            :items="toc"
            @select="(href) => {
              emit('tocSelect', href)
              emit('closePanel')
            }"
          />
          <div v-else class="ebook-reader__empty">未找到目录</div>
        </template>

        <template v-if="activePanel === 'search'">
          <div class="ebook-reader__field">
            <input
              class="ebook-reader__input"
              placeholder="输入关键词"
              :value="searchQuery"
              :disabled="status !== 'ready'"
              @input="(e: any) => {
                const v = e.target.value
                emit('update:searchQuery', v)
                if (!v.trim()) emit('search', '')
              }"
              @keydown.enter="emit('search', searchQuery)"
            />
            <button type="button" class="ebook-reader__btn" :disabled="status !== 'ready'" @click="emit('search', searchQuery)">
              搜索
            </button>
          </div>

          <div class="ebook-reader__checks">
            <label class="ebook-reader__check">
              <input
                type="checkbox"
                :checked="Boolean(searchOptions.matchCase)"
                @change="(e: any) => updateSearchOption('matchCase', e.target.checked)"
              />
              区分大小写
            </label>
            <label class="ebook-reader__check">
              <input
                type="checkbox"
                :checked="Boolean(searchOptions.wholeWords)"
                @change="(e: any) => updateSearchOption('wholeWords', e.target.checked)"
              />
              全词匹配
            </label>
            <label class="ebook-reader__check">
              <input
                type="checkbox"
                :checked="Boolean(searchOptions.matchDiacritics)"
                @change="(e: any) => updateSearchOption('matchDiacritics', e.target.checked)"
              />
              区分变音
            </label>
          </div>

          <div class="ebook-reader__meta">
            <span>进度 {{ searchProgressPercent }}%</span>
            <span v-if="searching">搜索中…</span>
            <button v-if="searching" type="button" class="ebook-reader__link" @click="emit('cancelSearch')">
              取消
            </button>
          </div>

          <SearchResultList v-if="searchResults.length" :results="searchResults" @select="(cfi) => emit('searchResultSelect', cfi)" />
          <div v-else class="ebook-reader__empty">{{ searchQuery.trim() ? '无匹配结果' : '请输入关键词' }}</div>
        </template>

        <template v-if="activePanel === 'progress'">
          <div class="ebook-reader__meta">
            <span class="ebook-reader__status">
              {{ status === 'error' ? errorText || '错误' : status === 'opening' ? '正在打开…' : '就绪' }}
            </span>
            <span v-if="sectionLabel">{{ sectionLabel }}</span>
          </div>
          <div class="ebook-reader__mprogress">
            <input
              class="ebook-reader__range"
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
            <div class="ebook-reader__mprogress-percent">{{ displayedPercent }}%</div>
          </div>
        </template>

        <template v-if="activePanel === 'theme'">
          <button type="button" class="ebook-reader__btn" @click="emit('toggleDarkMode', !darkMode)">
            {{ darkMode ? '切换到亮色' : '切换到暗黑' }}
          </button>
        </template>

        <template v-if="activePanel === 'font'">
          <div class="ebook-reader__mfont">
            <button type="button" class="ebook-reader__btn" @click="emit('changeFontSize', fontSize - 10)">
              A-
            </button>
            <div class="ebook-reader__font">{{ fontSize }}%</div>
            <button type="button" class="ebook-reader__btn" @click="emit('changeFontSize', fontSize + 10)">
              A+
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
