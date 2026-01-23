import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { VNode } from 'vue'
import { createEBookReader } from '../core/reader.js'
import type { ProgressInfo, SearchOptions, SearchResult, TocItem } from '../core/types.js'
import { EBookReaderVuePropsDef } from './types.js'
import type { EBookReaderVueEmits, EBookReaderVueExposed } from './types.js'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const mergeClassName = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ')

const renderTocItems = (items: TocItem[], onSelect: (href?: string) => void): VNode => {
  return h(
    'ul',
    { class: 'ebook-reader__toc-list' },
    items.map((item, idx) => {
      const key = item.href || `${item.label ?? 'item'}-${idx}`
      const hasChildren = Boolean(item.subitems?.length)
      const label = item.label || item.href || '未命名'

      if (!hasChildren) {
        return h('li', { key, class: 'ebook-reader__toc-item' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'ebook-reader__toc-btn',
              onClick: () => onSelect(item.href),
            },
            label,
          ),
        ])
      }

      return h('li', { key, class: 'ebook-reader__toc-item' }, [
        h('details', { class: 'ebook-reader__toc-details' }, [
          h('summary', { class: 'ebook-reader__toc-summary' }, label),
          renderTocItems(item.subitems ?? [], onSelect),
        ]),
      ])
    }),
  )
}

export const EBookReaderVue = defineComponent({
  name: 'EBookReaderVue',
  props: EBookReaderVuePropsDef,
  emits: ['ready', 'error', 'progress', 'fontSizeChange', 'darkModeChange'],
  setup(props, { emit, expose }) {
    const rootEl = ref<HTMLElement | null>(null)
    const viewerHost = ref<HTMLElement | null>(null)
    const reader = ref<ReturnType<typeof createEBookReader> | null>(null)

    const status = ref<'idle' | 'ready' | 'opening' | 'error'>('idle')
    const errorText = ref('')
    const toc = ref<TocItem[]>([])
    const tocOpen = ref(false)
    const searchOpen = ref(false)

    const progressInfo = ref<ProgressInfo | null>(null)
    const isSeeking = ref(false)
    const seekPercent = ref(0)

    const uncontrolledFontSize = ref(props.defaultFontSize ?? 100)
    const uncontrolledDarkMode = ref(Boolean(props.defaultDarkMode))

    const fontSize = () => (props.fontSize ?? uncontrolledFontSize.value)
    const darkMode = () => (props.darkMode ?? uncontrolledDarkMode.value)

    const searchQuery = ref('')
    const searchOptions = ref<SearchOptions>(props.defaultSearchOptions ?? { matchCase: false, wholeWords: false, matchDiacritics: false })
    const searchProgressPercent = ref(0)
    const searching = ref(false)
    const searchResults = ref<SearchResult[]>([])

    const closeDrawers = () => {
      tocOpen.value = false
      searchOpen.value = false
    }

    const setDarkModeInternal = (next: boolean) => {
      if (props.darkMode == null) uncontrolledDarkMode.value = next
      emit('darkModeChange', next)
      reader.value?.setDarkMode(next)
    }

    const setFontSizeInternal = (next: number) => {
      const safe = clamp(next, 50, 300)
      if (props.fontSize == null) uncontrolledFontSize.value = safe
      emit('fontSizeChange', safe)
      reader.value?.setFontSize(safe)
    }

    const openFile = async (nextFile: File) => {
      if (!reader.value) return
      status.value = 'opening'
      errorText.value = ''
      toc.value = []
      progressInfo.value = null
      isSeeking.value = false
      seekPercent.value = 0
      searchResults.value = []
      searchProgressPercent.value = 0
      searching.value = false

      try {
        await reader.value.open(nextFile)
        status.value = 'ready'
      } catch (e: any) {
        status.value = 'error'
        errorText.value = e?.message ? String(e.message) : '打开失败'
        emit('error', e)
      }
    }

    const runSearch = async (query: string) => {
      const r = reader.value
      const normalized = query.trim()
      searchQuery.value = query
      searchProgressPercent.value = 0
      searching.value = Boolean(normalized)

      if (!r || !normalized) {
        r?.clearSearch()
        searchResults.value = []
        searching.value = false
        return
      }

      r.cancelSearch()
      try {
        const results = await r.search(normalized, searchOptions.value)
        searchResults.value = results
        searchProgressPercent.value = 100
      } catch (e) {
        emit('error', e)
      } finally {
        searching.value = false
      }
    }

    const keydownHandler = (e: KeyboardEvent) => {
      if (!props.enableKeyboardNav) return
      if (e.key === 'ArrowLeft') reader.value?.prevPage()
      if (e.key === 'ArrowRight') reader.value?.nextPage()
      if (e.key === 'Escape') closeDrawers()
    }

    onMounted(async () => {
      await nextTick()
      const host = viewerHost.value
      if (!host) return

      try {
        reader.value = createEBookReader(host, {
          darkMode: darkMode(),
          fontSize: fontSize(),
          onReady: (h) => emit('ready', h),
          onError: (e) => emit('error', e),
          onProgress: (info) => {
            progressInfo.value = info
            emit('progress', info)
          },
          onToc: (items) => (toc.value = items),
          onSearchProgress: (info) => {
            if (typeof info.progress === 'number') searchProgressPercent.value = Math.round(info.progress * 100)
          },
        })
        status.value = 'ready'
      } catch (e: any) {
        status.value = 'error'
        errorText.value = e?.message ? String(e.message) : '初始化失败'
        emit('error', e)
        return
      }

      const root = rootEl.value
      if (root) root.addEventListener('keydown', keydownHandler)
    })

    onBeforeUnmount(() => {
      const root = rootEl.value
      if (root) root.removeEventListener('keydown', keydownHandler)
      reader.value?.destroy()
      reader.value = null
    })

    watch(
      () => props.file,
      (next) => {
        if (next) void openFile(next)
      },
    )

    watch(
      () => darkMode(),
      (v) => reader.value?.setDarkMode(Boolean(v)),
    )

    watch(
      () => fontSize(),
      (v) => reader.value?.setFontSize(Number(v)),
    )

    expose<EBookReaderVueExposed>({
      prevPage: () => reader.value?.prevPage(),
      nextPage: () => reader.value?.nextPage(),
      prevSection: () => reader.value?.prevSection(),
      nextSection: () => reader.value?.nextSection(),
      goTo: (t) => reader.value?.goTo(t),
      goToFraction: (f) => reader.value?.goToFraction(f),
      search: (q, o) => (reader.value ? reader.value.search(q, o) : Promise.resolve([])),
      cancelSearch: () => reader.value?.cancelSearch(),
      clearSearch: () => reader.value?.clearSearch(),
    })

    return () => {
      const pct = Math.round((progressInfo.value?.fraction ?? 0) * 100)
      const displayed = isSeeking.value ? seekPercent.value : pct
      const sectionLabel = progressInfo.value?.tocItem?.label ?? ''

      return h(
        'div',
        {
          ref: rootEl,
          class: 'ebook-reader',
          'data-theme': darkMode() ? 'dark' : 'light',
          tabindex: 0,
        },
        [
          h('div', { class: 'ebook-reader__viewer', ref: viewerHost }),

          h('div', { class: 'ebook-reader__toolbar' }, [
            h('div', { class: 'ebook-reader__panel' }, [
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '目录', onClick: () => (tocOpen.value = true) },
                '目录',
              ),
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '搜索', onClick: () => (searchOpen.value = true) },
                '搜索',
              ),
              h('div', { class: 'ebook-reader__divider' }),
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '上一章', onClick: () => reader.value?.prevSection() },
                '上一章',
              ),
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '上一页', onClick: () => reader.value?.prevPage() },
                '上一页',
              ),
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '下一页', onClick: () => reader.value?.nextPage() },
                '下一页',
              ),
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '下一章', onClick: () => reader.value?.nextSection() },
                '下一章',
              ),
            ]),
            h('div', { class: 'ebook-reader__panel' }, [
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '主题', onClick: () => setDarkModeInternal(!darkMode()) },
                darkMode() ? '亮色' : '暗黑',
              ),
              h('div', { class: 'ebook-reader__divider' }),
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '增大字号', onClick: () => setFontSizeInternal(fontSize() + 10) },
                'A+',
              ),
              h('div', { class: 'ebook-reader__font' }, `${fontSize()}%`),
              h(
                'button',
                { type: 'button', class: 'ebook-reader__btn', title: '减小字号', onClick: () => setFontSizeInternal(fontSize() - 10) },
                'A-',
              ),
            ]),
          ]),

          tocOpen.value || searchOpen.value ? h('div', { class: 'ebook-reader__overlay', onClick: closeDrawers }) : null,

          h('aside', { class: mergeClassName('ebook-reader__drawer', tocOpen.value ? 'is-open' : undefined), 'aria-hidden': !tocOpen.value }, [
            h('div', { class: 'ebook-reader__drawer-header' }, [
              h('div', { class: 'ebook-reader__drawer-title' }, '目录'),
              h('button', { type: 'button', class: 'ebook-reader__btn', onClick: () => (tocOpen.value = false) }, '关闭'),
            ]),
            h('div', { class: 'ebook-reader__drawer-body' }, [
              toc.value.length
                ? renderTocItems(toc.value, (href) => {
                    if (href) reader.value?.goTo(href)
                    tocOpen.value = false
                  })
                : h('div', { class: 'ebook-reader__empty' }, '未找到目录'),
            ]),
          ]),

          h(
            'aside',
            {
              class: mergeClassName('ebook-reader__drawer', 'right', searchOpen.value ? 'is-open' : undefined),
              'aria-hidden': !searchOpen.value,
            },
            [
              h('div', { class: 'ebook-reader__drawer-header' }, [
                h('div', { class: 'ebook-reader__drawer-title' }, '搜索'),
                h('button', { type: 'button', class: 'ebook-reader__btn', onClick: () => (searchOpen.value = false) }, '关闭'),
              ]),
              h('div', { class: 'ebook-reader__drawer-body' }, [
                h('div', { class: 'ebook-reader__field' }, [
                  h('input', {
                    class: 'ebook-reader__input',
                    placeholder: '输入关键词',
                    value: searchQuery.value,
                    disabled: status.value !== 'ready',
                    onInput: (e: any) => {
                      const v = String(e?.target?.value ?? '')
                      searchQuery.value = v
                      if (!v.trim()) void runSearch('')
                    },
                    onKeydown: (e: KeyboardEvent) => {
                      if (e.key === 'Enter') void runSearch(searchQuery.value)
                    },
                  }),
                  h(
                    'button',
                    { type: 'button', class: 'ebook-reader__btn', disabled: status.value !== 'ready', onClick: () => void runSearch(searchQuery.value) },
                    '搜索',
                  ),
                ]),
                h('div', { class: 'ebook-reader__checks' }, [
                  h('label', { class: 'ebook-reader__check' }, [
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(searchOptions.value.matchCase),
                      onChange: (e: any) => (searchOptions.value = { ...searchOptions.value, matchCase: Boolean(e?.target?.checked) }),
                    }),
                    '区分大小写',
                  ]),
                  h('label', { class: 'ebook-reader__check' }, [
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(searchOptions.value.wholeWords),
                      onChange: (e: any) => (searchOptions.value = { ...searchOptions.value, wholeWords: Boolean(e?.target?.checked) }),
                    }),
                    '全词匹配',
                  ]),
                  h('label', { class: 'ebook-reader__check' }, [
                    h('input', {
                      type: 'checkbox',
                      checked: Boolean(searchOptions.value.matchDiacritics),
                      onChange: (e: any) => (searchOptions.value = { ...searchOptions.value, matchDiacritics: Boolean(e?.target?.checked) }),
                    }),
                    '区分变音',
                  ]),
                ]),
                h('div', { class: 'ebook-reader__meta' }, [
                  h('span', null, `进度 ${searchProgressPercent.value}%`),
                  searching.value ? h('span', null, '搜索中…') : null,
                  searching.value
                    ? h('button', { type: 'button', class: 'ebook-reader__link', onClick: () => reader.value?.cancelSearch() }, '取消')
                    : null,
                ]),
                searchResults.value.length
                  ? h(
                      'ul',
                      { class: 'ebook-reader__search-list' },
                      searchResults.value.map((r, idx) =>
                        h('li', { key: `${r.cfi ?? 'no-cfi'}-${idx}`, class: 'ebook-reader__search-item' }, [
                          h(
                            'button',
                            {
                              type: 'button',
                              class: 'ebook-reader__search-btn',
                              onClick: () => {
                                if (r.cfi) reader.value?.goTo(r.cfi)
                              },
                            },
                            [
                              r.label ? h('div', { class: 'ebook-reader__search-label' }, r.label) : null,
                              h(
                                'div',
                                { class: 'ebook-reader__search-excerpt' },
                                typeof r.excerpt === 'string'
                                  ? r.excerpt
                                  : `${r.excerpt?.pre ?? ''}${r.excerpt?.match ?? ''}${r.excerpt?.post ?? ''}`,
                              ),
                            ],
                          ),
                        ]),
                      ),
                    )
                  : h('div', { class: 'ebook-reader__empty' }, searchQuery.value.trim() ? '无匹配结果' : '请输入关键词'),
              ]),
            ],
          ),

          h('div', { class: 'ebook-reader__bottom' }, [
            h('div', { class: 'ebook-reader__bottom-left' }, [
              h(
                'span',
                { class: 'ebook-reader__status' },
                status.value === 'error' ? errorText.value || '错误' : status.value === 'opening' ? '正在打开…' : '就绪',
              ),
              sectionLabel ? h('span', { class: 'ebook-reader__section' }, sectionLabel) : null,
            ]),
            h('div', { class: 'ebook-reader__bottom-right' }, [
              h('input', {
                class: 'ebook-reader__range',
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                value: displayed,
                onInput: (e: any) => {
                  isSeeking.value = true
                  seekPercent.value = Number(e?.target?.value ?? 0)
                },
                onPointerup: (e: any) => {
                  const v = Number(e?.target?.value ?? 0)
                  isSeeking.value = false
                  reader.value?.goToFraction(v / 100)
                },
                onKeyup: (e: KeyboardEvent) => {
                  if (e.key !== 'Enter') return
                  const v = Number((e.target as HTMLInputElement)?.value ?? 0)
                  isSeeking.value = false
                  reader.value?.goToFraction(v / 100)
                },
              }),
              h('span', { class: 'ebook-reader__percent' }, `${displayed}%`),
            ]),
          ]),
        ],
      )
    }
  },
})
