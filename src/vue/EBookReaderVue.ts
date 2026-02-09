import { defineComponent, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createEBookReader } from '../core/reader.js'
import type { ProgressInfo, SearchOptions, SearchResult, TocItem } from '../core/types.js'
import { EBookReaderVuePropsDef } from './types.js'
import type { EBookReaderVueEmits, EBookReaderVueExposed, MobilePanel } from './types.js'
import DesktopToolbar from './components/DesktopToolbar.vue'
import DesktopBottomBar from './components/DesktopBottomBar.vue'
import TocDrawer from './components/TocDrawer.vue'
import SearchDrawer from './components/SearchDrawer.vue'
import MobileUI from './components/MobileUI.vue'

const MOBILE_MAX_WIDTH = 768
const WIDE_MIN_WIDTH = 1024

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const mergeClassName = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ')

const getFileNameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition) return null
  const starMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (starMatch?.[1]) {
    try {
      return decodeURIComponent(starMatch[1].replace(/^"|"$/g, ''))
    } catch {
      return starMatch[1].replace(/^"|"$/g, '')
    }
  }

  const match = contentDisposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;\s]+))/i)
  return match?.[1] ?? match?.[2] ?? null
}

const normalizeEpubFileName = (name: string) => {
  const trimmed = name.trim()
  if (!trimmed) return 'book.epub'
  if (trimmed.toLowerCase().endsWith('.epub')) return trimmed
  if (!trimmed.includes('.')) return `${trimmed}.epub`
  return trimmed
}

const getFileNameFromUrl = (url: string) => {
  try {
    const u = new URL(url, window.location.href)
    const last = u.pathname.split('/').filter(Boolean).pop()
    return last ? decodeURIComponent(last) : null
  } catch {
    return null
  }
}

const downloadEpubAsFile = async (url: string, signal: AbortSignal) => {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`下载失败 (${res.status})`)
  const blob = await res.blob()

  const headerName = getFileNameFromContentDisposition(res.headers.get('content-disposition'))
  const urlName = getFileNameFromUrl(url)
  const fileName = normalizeEpubFileName(headerName ?? urlName ?? 'book.epub')
  const type = blob.type || 'application/epub+zip'

  return new File([blob], fileName, { type })
}

export const EBookReaderVue = defineComponent({
  name: 'EBookReaderVue',
  props: EBookReaderVuePropsDef,
  emits: ['ready', 'error', 'progress', 'fontSizeChange', 'darkModeChange', 'update:fontSize', 'update:darkMode'],
  setup(props, { emit, expose }) {
    const instance = getCurrentInstance()
    const isPropProvided = (key: string) => {
      const vnodeProps = instance?.vnode.props
      if (!vnodeProps) return false
      return Object.prototype.hasOwnProperty.call(vnodeProps, key)
    }

    const rootEl = ref<HTMLElement | null>(null)
    const viewerHost = ref<HTMLElement | null>(null)
    const reader = ref<ReturnType<typeof createEBookReader> | null>(null)

    const status = ref<'idle' | 'ready' | 'opening' | 'error'>('idle')
    const errorText = ref('')
    const downloadLoading = ref<null | 'download' | 'open'>(null)
    const toc = ref<TocItem[]>([])
    const tocOpen = ref(false)
    const searchOpen = ref(false)

    const progressInfo = ref<ProgressInfo | null>(null)
    const isSeeking = ref(false)
    const isDragging = ref(false)
    const seekPercent = ref(0)

    const layout = ref<'mobile' | 'default' | 'wide'>('default')
    const mobileBarVisible = ref(false)
    const mobilePanel = ref<MobilePanel | null>(null)

    const uncontrolledFontSize = ref(props.defaultFontSize ?? 100)
    const uncontrolledDarkMode = ref(Boolean(props.defaultDarkMode))

    const fontSize = () => (props.fontSize ?? uncontrolledFontSize.value)
    const darkMode = () => (isPropProvided('darkMode') ? Boolean(props.darkMode) : uncontrolledDarkMode.value)

    const searchQuery = ref('')
    const searchOptions = ref<SearchOptions>(props.defaultSearchOptions ?? { matchCase: false, wholeWords: false, matchDiacritics: false })
    const searchProgressPercent = ref(0)
    const searching = ref(false)
    const searchResults = ref<SearchResult[]>([])

    const closeDrawers = () => {
      tocOpen.value = false
      searchOpen.value = false
    }

    const closeMobileSheet = () => {
      mobilePanel.value = null
    }

    const toggleMobilePanel = (panel: MobilePanel) => {
      mobileBarVisible.value = true
      mobilePanel.value = mobilePanel.value === panel ? null : panel
    }

    const setDarkModeInternal = (next: boolean) => {
      if (!isPropProvided('darkMode')) uncontrolledDarkMode.value = next
      emit('update:darkMode', next)
      emit('darkModeChange', next)
      reader.value?.setDarkMode(next)
    }

    const setFontSizeInternal = (next: number) => {
      const safe = clamp(next, 50, 300)
      if (props.fontSize == null) uncontrolledFontSize.value = safe
      emit('update:fontSize', safe)
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

    let openController: AbortController | null = null

    const openFromProps = async () => {
      if (!reader.value) return

      openController?.abort()
      openController = null
      downloadLoading.value = null

      if (props.file) {
        await openFile(props.file)
        return
      }

      const nextUrl = props.fileUrl?.trim()
      if (!nextUrl) return

      const controller = new AbortController()
      openController = controller
      downloadLoading.value = 'download'

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
        const downloaded = await downloadEpubAsFile(nextUrl, controller.signal)
        if (controller.signal.aborted) return
        if (openController !== controller) return
        downloadLoading.value = 'open'
        await openFile(downloaded)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        status.value = 'error'
        errorText.value = e?.message ? String(e.message) : '下载失败'
        emit('error', e)
      } finally {
        if (openController === controller) downloadLoading.value = null
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

    let gestureStartX = 0
    let gestureStartY = 0
    let gestureTracking = false
    let gestureMoved = false
    let gestureActionTaken = false
    let gestureStartAt = 0
    const boundDocs = new WeakSet<Document>()

    const pointerDownHandler = (e: PointerEvent) => {
      if (layout.value !== 'mobile') return
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest('.epub-reader__mbar') || t.closest('.epub-reader__msheet')) return
      if (t.closest('a,button,input,textarea,select,label,[role="button"],[contenteditable="true"]')) return
      gestureTracking = true
      gestureMoved = false
      gestureActionTaken = false
      gestureStartAt = e.timeStamp
      gestureStartX = e.screenX
      gestureStartY = e.screenY
    }

    const pointerMoveHandler = (e: PointerEvent) => {
      if (!gestureTracking) return
      const dx = e.screenX - gestureStartX
      const dy = e.screenY - gestureStartY

      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) gestureMoved = true
      if (Math.abs(dy) < 8) return

      if (Math.abs(dy) < Math.abs(dx)) {
        if (Math.abs(dx) >= 8) gestureTracking = false
        return
      }

      if (dy <= -24) {
        gestureActionTaken = true
        gestureTracking = false
        mobileBarVisible.value = true
        return
      }
      if (dy >= 24) {
        gestureActionTaken = true
        gestureTracking = false
        mobileBarVisible.value = false
        mobilePanel.value = null
      }
    }

    const pointerEndHandler = (e: PointerEvent) => {
      if (layout.value !== 'mobile') {
        gestureTracking = false
        return
      }

      if (gestureActionTaken) {
        gestureTracking = false
        gestureMoved = false
        gestureActionTaken = false
        return
      }

      if (!gestureTracking) {
        gestureMoved = false
        return
      }

      const dx = e.screenX - gestureStartX
      const dy = e.screenY - gestureStartY
      const dt = e.timeStamp - gestureStartAt
      const isTap = !gestureMoved && Math.hypot(dx, dy) <= 10 && dt <= 300

      if (isTap) {
        const next = !mobileBarVisible.value
        mobileBarVisible.value = next
        if (!next) mobilePanel.value = null
      }

      gestureTracking = false
      gestureMoved = false
    }

    const bindContentPointerListeners = (doc: Document) => {
      if (boundDocs.has(doc)) return
      boundDocs.add(doc)
      doc.addEventListener('pointerdown', pointerDownHandler)
      doc.addEventListener('pointermove', pointerMoveHandler)
      doc.addEventListener('pointerup', pointerEndHandler)
      doc.addEventListener('pointercancel', pointerEndHandler)
    }

    let ro: ResizeObserver | null = null

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
            if (!isDragging.value) {
              isSeeking.value = false
            }
            emit('progress', info)
          },
          onToc: (items) => (toc.value = items),
          onSearchProgress: (info) => {
            if (typeof info.progress === 'number') searchProgressPercent.value = Math.round(info.progress * 100)
          },
          onContentLoad: (doc) => bindContentPointerListeners(doc),
        })
        status.value = 'ready'
      } catch (e: any) {
        status.value = 'error'
        errorText.value = e?.message ? String(e.message) : '初始化失败'
        emit('error', e)
        return
      }

      void openFromProps()

      const root = rootEl.value
      if (root) {
        root.addEventListener('keydown', keydownHandler)
        root.addEventListener('pointerdown', pointerDownHandler)
        root.addEventListener('pointermove', pointerMoveHandler)
        root.addEventListener('pointerup', pointerEndHandler)
        root.addEventListener('pointercancel', pointerEndHandler)
      }

      if (root) {
        ro = new ResizeObserver((entries) => {
          const w = entries[0]?.contentRect?.width ?? root.getBoundingClientRect().width
          layout.value = w <= MOBILE_MAX_WIDTH ? 'mobile' : w >= WIDE_MIN_WIDTH ? 'wide' : 'default'
        })
        ro.observe(root)
      }
    })

    onBeforeUnmount(() => {
      openController?.abort()
      downloadLoading.value = null
      const root = rootEl.value
      if (root) {
        root.removeEventListener('keydown', keydownHandler)
        root.removeEventListener('pointerdown', pointerDownHandler)
        root.removeEventListener('pointermove', pointerMoveHandler)
        root.removeEventListener('pointerup', pointerEndHandler)
        root.removeEventListener('pointercancel', pointerEndHandler)
      }
      ro?.disconnect()
      reader.value?.destroy()
      reader.value = null
    })

    watch(
      () => [props.file, props.fileUrl],
      () => void openFromProps(),
    )

    watch(
      () => darkMode(),
      (v) => reader.value?.setDarkMode(Boolean(v)),
    )

    watch(
      () => fontSize(),
      (v) => reader.value?.setFontSize(Number(v)),
    )

    watch(
      () => layout.value,
      (v) => {
        closeDrawers()
        if (v !== 'mobile') {
          mobilePanel.value = null
          mobileBarVisible.value = false
        }
      },
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
      const isMobile = layout.value === 'mobile'

      const viewer = h('div', { class: 'epub-reader__viewer', ref: viewerHost })
      const loading = downloadLoading.value
        ? h('div', { class: 'epub-reader__loading', role: 'status', 'aria-live': 'polite' }, [
            h('div', { class: 'epub-reader__spinner', 'aria-hidden': 'true' }),
            h('div', { class: 'epub-reader__loading-text' }, downloadLoading.value === 'download' ? '下载中…' : '加载中…'),
          ])
        : null

      const children = isMobile
        ? [
            viewer,
            loading,
            h(MobileUI, {
              barVisible: mobileBarVisible.value,
              activePanel: mobilePanel.value,
              toc: toc.value,
              status: status.value,
              errorText: errorText.value,
              sectionLabel: sectionLabel,
              displayedPercent: displayed,
              darkMode: darkMode(),
              fontSize: fontSize(),
              searchQuery: searchQuery.value,
              searchOptions: searchOptions.value,
              searchProgressPercent: searchProgressPercent.value,
              searching: searching.value,
              searchResults: searchResults.value,
              
              onTogglePanel: toggleMobilePanel,
              onClosePanel: closeMobileSheet,
              onTocSelect: (href: string | undefined) => {
                if (href) reader.value?.goTo(href)
              },
              onSearch: (q: string) => void runSearch(q),
              'onUpdate:searchQuery': (v: string) => (searchQuery.value = v),
              'onUpdate:searchOptions': (v: Partial<SearchOptions>) => (searchOptions.value = { ...searchOptions.value, ...v }),
              onCancelSearch: () => reader.value?.cancelSearch(),
              onSearchResultSelect: (cfi: string) => {
                if (cfi) reader.value?.goTo(cfi)
              },
              onSeekStart: () => {
                isSeeking.value = true
                isDragging.value = true
              },
              onSeekChange: (v: number) => (seekPercent.value = v),
              onSeekEnd: (v: number) => {
                isDragging.value = false
                reader.value?.goToFraction(v / 100)
              },
              onSeekCommit: (v: number) => {
                isDragging.value = false
                reader.value?.goToFraction(v / 100)
              },
              onToggleDarkMode: setDarkModeInternal,
              onChangeFontSize: setFontSizeInternal,
            }),
          ]
        : [
            viewer,
            loading,
            h(DesktopToolbar, {
              darkMode: darkMode(),
              fontSize: fontSize(),
              onToggleToc: () => (tocOpen.value = true),
              onToggleSearch: () => (searchOpen.value = true),
              onPrevSection: () => reader.value?.prevSection(),
              onPrevPage: () => reader.value?.prevPage(),
              onNextPage: () => reader.value?.nextPage(),
              onNextSection: () => reader.value?.nextSection(),
              onToggleDarkMode: () => setDarkModeInternal(!darkMode()),
              onChangeFontSize: setFontSizeInternal,
            }),
            tocOpen.value || searchOpen.value ? h('div', { class: 'epub-reader__overlay', onClick: closeDrawers }) : null,
            h(TocDrawer, {
              isOpen: tocOpen.value,
              toc: toc.value,
              onClose: () => (tocOpen.value = false),
              onSelect: (href: string | undefined) => {
                if (href) reader.value?.goTo(href)
              },
            }),
            h(SearchDrawer, {
              isOpen: searchOpen.value,
              status: status.value,
              query: searchQuery.value,
              options: searchOptions.value,
              progressPercent: searchProgressPercent.value,
              searching: searching.value,
              results: searchResults.value,
              onClose: () => (searchOpen.value = false),
              onSearch: (q: string) => void runSearch(q),
              'onUpdate:query': (v: string) => (searchQuery.value = v),
              'onUpdate:options': (v: Partial<SearchOptions>) => (searchOptions.value = { ...searchOptions.value, ...v }),
              onCancelSearch: () => reader.value?.cancelSearch(),
              onSelectResult: (cfi: string) => {
                if (cfi) reader.value?.goTo(cfi)
              },
            }),
            h(DesktopBottomBar, {
              status: status.value,
              errorText: errorText.value,
              sectionLabel: sectionLabel,
              displayedPercent: displayed,
              onSeekStart: () => {
                isSeeking.value = true
                isDragging.value = true
              },
              onSeekChange: (v: number) => (seekPercent.value = v),
              onSeekEnd: (v: number) => {
                isDragging.value = false
                reader.value?.goToFraction(v / 100)
              },
              onSeekCommit: (v: number) => {
                isDragging.value = false
                reader.value?.goToFraction(v / 100)
              },
            }),
          ]

      return h(
        'div',
        {
          ref: rootEl,
          class: 'epub-reader',
          'data-theme': darkMode() ? 'dark' : 'light',
          'data-layout': layout.value,
          'aria-busy': downloadLoading.value != null,
          tabindex: 0,
        },
        children,
      )
    }
  },
})
