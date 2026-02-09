<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { TocItem, SearchOptions, SearchResult } from '../../core/types'
import TocTree from './TocTree.vue'
import SearchResultList from './SearchResultList.vue'
import SvgIcon from './SvgIcon.vue'
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
    case 'settings': return '设置'
    default: return ''
  }
})

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const displayedFontSize = computed(() => clamp(Math.round(props.fontSize / 5), 10, 40))

const fontSliderValue = ref(displayedFontSize.value)
const fontSliderWrapRef = ref<HTMLElement | null>(null)
const fontSliderWidth = ref(0)
const isFontDragging = ref(false)
const fontThumbSize = 34
const fontMin = 10
const fontMax = 40
let fontRo: ResizeObserver | null = null
let fontDebounceTimer: number | null = null

watch(displayedFontSize, (v) => {
  fontSliderValue.value = v
})

const teardownFontResize = () => {
  if (fontRo) {
    fontRo.disconnect()
    fontRo = null
  }
}

const setupFontResize = async () => {
  await nextTick()
  const el = fontSliderWrapRef.value
  if (!el) return
  const update = () => {
    fontSliderWidth.value = el.getBoundingClientRect().width
  }
  update()
  teardownFontResize()
  fontRo = new ResizeObserver(() => update())
  fontRo.observe(el)
}

watch(
  () => props.activePanel,
  (p) => {
    if (p === 'settings') void setupFontResize()
    else teardownFontResize()
  },
  { immediate: true },
)

onBeforeUnmount(() => teardownFontResize())

const fontProgressPercent = computed(() => ((fontSliderValue.value - fontMin) / (fontMax - fontMin)) * 100)
const fontThumbLeft = computed(() => {
  if (!fontSliderWidth.value) return 0
  const percent = (fontSliderValue.value - fontMin) / (fontMax - fontMin)
  const half = fontThumbSize / 2
  return Math.min(fontSliderWidth.value - half, Math.max(half, half + percent * (fontSliderWidth.value - fontThumbSize)))
})

const flushFontSize = () => {
  if (fontDebounceTimer) {
    clearTimeout(fontDebounceTimer)
    fontDebounceTimer = null
  }
  emit('changeFontSize', fontSliderValue.value * 5)
}

const scheduleFontSize = (next: number) => {
  if (fontDebounceTimer) clearTimeout(fontDebounceTimer)
  fontDebounceTimer = window.setTimeout(() => {
    fontDebounceTimer = null
    emit('changeFontSize', next * 5)
  }, 80)
}

const handleFontSliderInput = (e: Event) => {
  const next = Number((e.target as HTMLInputElement).value)
  fontSliderValue.value = next
  scheduleFontSize(next)
}

onBeforeUnmount(() => {
  if (fontDebounceTimer) clearTimeout(fontDebounceTimer)
})

const updateSearchOption = (key: keyof SearchOptions, value: boolean) => {
  emit('update:searchOptions', { [key]: value })
}

const tooltip = ref<{ text: string, left: number } | null>(null)
let timer: number | null = null

const ignoreToggle = ref(false)

const markIgnoreToggle = () => {
  ignoreToggle.value = true
  window.setTimeout(() => {
    ignoreToggle.value = false
  }, 350)
}

const clearTooltip = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  tooltip.value = null
}

const closePanelSafe = () => {
  emit('closePanel')
  clearTooltip()
  const el = document.activeElement
  if (el && el instanceof HTMLElement) el.blur()
}

const togglePanelSafe = (panel: MobilePanel) => {
  if (ignoreToggle.value) return
  emit('togglePanel', panel)
}

const sheetRef = ref<HTMLElement | null>(null)
const dragRef = { startY: 0, currentY: 0, isDragging: false }

const handleHeaderTouchStart = (e: TouchEvent) => {
  clearTooltip()
  dragRef.startY = e.touches[0].clientY
  dragRef.isDragging = true
  if (sheetRef.value) {
    sheetRef.value.style.transition = 'none'
  }
}

const handleHeaderTouchMove = (e: TouchEvent) => {
  if (!dragRef.isDragging) return
  e.preventDefault()
  const deltaY = e.touches[0].clientY - dragRef.startY
  if (deltaY > 0 && sheetRef.value) {
    // 允许跟随手指下滑
    sheetRef.value.style.transform = `translateY(${deltaY}px)`
    dragRef.currentY = deltaY
  }
}

const handleHeaderTouchEnd = () => {
  if (!dragRef.isDragging) return
  dragRef.isDragging = false
  
  if (sheetRef.value) {
    sheetRef.value.style.transition = '' // 恢复 CSS 中的 transition
    
    // 如果下滑距离超过 80px，则关闭
    if (dragRef.currentY > 80) {
      markIgnoreToggle()
      closePanelSafe()
      // 稍微延迟清空 transform，避免闪烁
      setTimeout(() => {
        if (sheetRef.value) sheetRef.value.style.transform = ''
      }, 300)
    } else {
      // 回弹
      sheetRef.value.style.transform = ''
    }
  }
  dragRef.currentY = 0
}

const handleTouchStart = (e: TouchEvent, text: string) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  timer = window.setTimeout(() => {
    tooltip.value = {
      text,
      left: rect.left + rect.width / 2
    }
  }, 500)
}

const handleTouchEnd = () => {
  clearTooltip()
}
</script>

<template>
  <div>
    <div :class="['epub-reader__mbar', { 'is-visible': barVisible }]">
      <div 
        v-if="tooltip"
        class="epub-reader__tooltip"
        :style="{
          position: 'fixed',
          bottom: '60px',
          left: `${tooltip.left}px`,
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap'
        }"
      >
        {{ tooltip.text }}
      </div>
      <button 
        type="button" 
        class="epub-reader__btn" 
        :aria-pressed="activePanel === 'menu'" 
        @click="togglePanelSafe('menu')"
        @touchstart="(e) => handleTouchStart(e, '目录')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        title="目录"
      >
        <SvgIcon name="list" />
      </button>
      <button 
        type="button" 
        class="epub-reader__btn" 
        :aria-pressed="activePanel === 'search'" 
        @click="togglePanelSafe('search')"
        @touchstart="(e) => handleTouchStart(e, '搜索')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        title="搜索"
      >
        <SvgIcon name="search" />
      </button>
      <button 
        type="button" 
        class="epub-reader__btn" 
        :aria-pressed="activePanel === 'progress'" 
        @click="togglePanelSafe('progress')"
        @touchstart="(e) => handleTouchStart(e, '进度')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        title="进度"
      >
        <SvgIcon name="sliders" />
      </button>
      <button 
        type="button" 
        class="epub-reader__btn" 
        :aria-pressed="activePanel === 'settings'" 
        @click="togglePanelSafe('settings')"
        @touchstart="(e) => handleTouchStart(e, '设置')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        title="设置"
      >
        <SvgIcon name="settings" />
      </button>

      <slot v-if="$slots.toolbarRight" name="toolbarRight" />
    </div>

    <div v-if="activePanel" class="epub-reader__moverlay" @click="closePanelSafe" />

    <div 
      ref="sheetRef"
      :class="['epub-reader__msheet', { 'is-open': activePanel }]" 
      :aria-hidden="!activePanel"
    >
      <div 
        class="epub-reader__msheet-header"
        @touchstart="handleHeaderTouchStart"
        @touchmove="handleHeaderTouchMove"
        @touchend="handleHeaderTouchEnd"
      >
        <div class="epub-reader__msheet-title">{{ mobileTitle }}</div>
        <button type="button" class="epub-reader__btn" @click="closePanelSafe">
          <SvgIcon name="x" />
        </button>
      </div>
      <div class="epub-reader__msheet-body">
        <template v-if="activePanel === 'menu'">
          <TocTree
            v-if="toc.length"
            :items="toc"
            @select="(href) => {
              emit('tocSelect', href)
              closePanelSafe()
            }"
          />
          <div v-else class="epub-reader__empty">未找到目录</div>
        </template>

        <template v-if="activePanel === 'search'">
          <div class="epub-reader__field">
            <input
              class="epub-reader__input"
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
            <button type="button" class="epub-reader__btn" :disabled="status !== 'ready'" @click="emit('search', searchQuery)">
              搜索
            </button>
          </div>

          <div class="epub-reader__checks">
            <label class="epub-reader__check">
              <input
                type="checkbox"
                :checked="Boolean(searchOptions.matchCase)"
                @change="(e: any) => updateSearchOption('matchCase', e.target.checked)"
              />
              区分大小写
            </label>
            <label class="epub-reader__check">
              <input
                type="checkbox"
                :checked="Boolean(searchOptions.wholeWords)"
                @change="(e: any) => updateSearchOption('wholeWords', e.target.checked)"
              />
              全词匹配
            </label>
            <label class="epub-reader__check">
              <input
                type="checkbox"
                :checked="Boolean(searchOptions.matchDiacritics)"
                @change="(e: any) => updateSearchOption('matchDiacritics', e.target.checked)"
              />
              区分变音
            </label>
          </div>

          <div class="epub-reader__meta">
            <span>进度 {{ searchProgressPercent }}%</span>
            <span v-if="searching">搜索中…</span>
            <button v-if="searching" type="button" class="epub-reader__link" @click="emit('cancelSearch')">
              取消
            </button>
          </div>

          <SearchResultList v-if="searchResults.length" :results="searchResults" @select="(cfi) => emit('searchResultSelect', cfi)" />
          <div v-else class="epub-reader__empty">{{ searchQuery.trim() ? '无匹配结果' : '请输入关键词' }}</div>
        </template>

        <template v-if="activePanel === 'progress'">
          <div class="epub-reader__meta">
            <span class="epub-reader__status">
              {{ status === 'error' ? errorText || '错误' : status === 'opening' ? '正在打开…' : '' }}
            </span>
            <span v-if="sectionLabel">{{ sectionLabel }}</span>
          </div>
          <div class="epub-reader__mprogress">
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
            <div class="epub-reader__mprogress-percent">{{ displayedPercent }}%</div>
          </div>
        </template>

        <template v-if="activePanel === 'settings'">
          <div class="epub-reader__msettings">
            <div class="epub-reader__mfont-range">
              <div class="epub-reader__mfont-a is-small">A</div>
              <div ref="fontSliderWrapRef" :class="['epub-reader__mfont-slider', { 'is-dragging': isFontDragging }]">
                <input
                  class="epub-reader__range"
                  type="range"
                  :min="fontMin"
                  :max="fontMax"
                  :step="1"
                  :value="fontSliderValue"
                  :style="{ background: `linear-gradient(to right, var(--epub-reader-range-fill) 0%, var(--epub-reader-range-fill) ${fontProgressPercent}%, var(--epub-reader-range-track) ${fontProgressPercent}%, var(--epub-reader-range-track) 100%)` }"
                  aria-label="字号"
                  @input="handleFontSliderInput"
                  @pointerdown="isFontDragging = true"
                  @pointerup="() => { isFontDragging = false; flushFontSize() }"
                  @pointercancel="() => { isFontDragging = false; flushFontSize() }"
                  @touchstart="isFontDragging = true"
                  @touchend="() => { isFontDragging = false; flushFontSize() }"
                />
                <div class="epub-reader__mfont-thumb" :style="{ left: `${fontThumbLeft}px`, width: `${fontThumbSize}px`, height: `${fontThumbSize}px` }">
                  {{ fontSliderValue }}
                </div>
              </div>
              <div class="epub-reader__mfont-a is-big">A</div>
            </div>

            <button
              type="button"
              class="epub-reader__btn"
              :aria-pressed="darkMode"
              :aria-label="darkMode ? '暗黑模式：开，点击切换到亮色' : '暗黑模式：关，点击切换到暗黑'"
              :title="darkMode ? '切换到亮色' : '切换到暗黑'"
              @click="emit('toggleDarkMode', !darkMode)"
            >
              <SvgIcon :name="darkMode ? 'sun' : 'moon'" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
