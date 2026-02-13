import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { createEBookReader } from '../core/reader.js'
import type { ProgressInfo, TocItem } from '../core/types.js'
import type { EBookReaderReactHandle, EBookReaderReactProps, SearchState, MobilePanel } from './types.js'
import { MobileUI } from './components/MobileUI'

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

/**
 * EBookReader 组件
 *
 * 核心阅读器组件，负责：
 * 1. 管理核心 Reader 实例 (createEBookReader)
 * 2. 管理 UI 状态 (布局、弹窗、搜索状态等)
 * 3. 分发事件和数据给子组件 (Desktop/Mobile)
 */
export const EBookReader = forwardRef<EBookReaderReactHandle, EBookReaderReactProps>(function EBookReader(
  {
    file,
    fileUrl,
    className,
    style,
    themeColor,
    mobileToolbarRight,
    defaultFontSize = 100,
    fontSize: controlledFontSize,
    onFontSizeChange,
    defaultLineHeight = 1.6,
    lineHeight: controlledLineHeight,
    onLineHeightChange,
    defaultLetterSpacing = 0,
    letterSpacing: controlledLetterSpacing,
    onLetterSpacingChange,
    defaultDarkMode = false,
    darkMode: controlledDarkMode,
    onDarkModeChange,
    enableKeyboardNav = true,
    defaultSearchOptions = { matchCase: false, wholeWords: false, matchDiacritics: false },
    onReady,
    onError,
    onProgress,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const viewerHostRef = useRef<HTMLDivElement | null>(null)
  const readerRef = useRef<ReturnType<typeof createEBookReader> | null>(null)

  const [status, setStatus] = useState<'idle' | 'ready' | 'opening' | 'error'>('idle')
  const [errorText, setErrorText] = useState<string>('')
  const [toc, setToc] = useState<TocItem[]>([])
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPercent, setSeekPercent] = useState(0)
  const [downloadLoading, setDownloadLoading] = useState<null | 'download' | 'open'>(null)

  const [uncontrolledFontSize, setUncontrolledFontSize] = useState(defaultFontSize)
  const [uncontrolledDarkMode, setUncontrolledDarkMode] = useState(defaultDarkMode)
  const [uncontrolledLineHeight, setUncontrolledLineHeight] = useState(defaultLineHeight)
  const [uncontrolledLetterSpacing, setUncontrolledLetterSpacing] = useState(defaultLetterSpacing)

  const fontSize = controlledFontSize ?? uncontrolledFontSize
  const darkMode = controlledDarkMode ?? uncontrolledDarkMode
  const lineHeight = controlledLineHeight ?? uncontrolledLineHeight
  const letterSpacing = controlledLetterSpacing ?? uncontrolledLetterSpacing

  const [search, setSearch] = useState<SearchState>({
    query: '',
    options: defaultSearchOptions,
    progressPercent: 0,
    searching: false,
    results: [],
  })

  const [layout, setLayout] = useState<'mobile' | 'default' | 'wide'>('default')
  const [mobileBarVisible, setMobileBarVisible] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel | null>(null)
  const layoutRef = useRef(layout)
  const boundDocsRef = useRef(new WeakSet<Document>())
  const gestureRef = useRef({ startX: 0, startY: 0, startAt: 0, tracking: false, moved: false, actionTaken: false })
  const pcDragRef = useRef({ startX: 0, startY: 0, startAt: 0, tracking: false, moved: false, actionTaken: false })
  const isDraggingRef = useRef(false)

  const percentage = useMemo(() => Math.round((progressInfo?.fraction ?? 0) * 100), [progressInfo])
  const displayedPercent = isSeeking ? seekPercent : percentage
  const sectionLabel = progressInfo?.tocItem?.label ?? ''

  // 监听容器大小变化，切换布局模式
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? el.getBoundingClientRect().width
      const next = w <= MOBILE_MAX_WIDTH ? 'mobile' : w >= WIDE_MIN_WIDTH ? 'wide' : 'default'
      setLayout((prev) => (prev === next ? prev : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 布局切换时重置移动端面板状态
  useEffect(() => {
    setMobilePanel(null)
    setMobileBarVisible(false)
  }, [layout])

  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  const closeMobileSheet = useCallback(() => setMobilePanel(null), [])

  const toggleMobilePanel = useCallback((panel: MobilePanel) => {
    setMobileBarVisible(true)
    setMobilePanel((prev) => (prev === panel ? null : panel))
  }, [])

  const onPointerDown = useCallback((e: PointerEvent) => {
    const t = e.target as HTMLElement | null
    if (!t) return
    if (t.closest('.epub-reader__mbar') || t.closest('.epub-reader__msheet')) return
    if (t.closest('a,button,input,textarea,select,label,[role="button"],[contenteditable="true"]')) return

    if (layoutRef.current !== 'mobile') {
      if (e.pointerType !== 'mouse') return
      if ((e.buttons & 1) !== 1) return
      pcDragRef.current.tracking = true
      pcDragRef.current.actionTaken = false
      pcDragRef.current.moved = false
      pcDragRef.current.startX = e.screenX
      pcDragRef.current.startY = e.screenY
      pcDragRef.current.startAt = e.timeStamp
      return
    }

    gestureRef.current.tracking = true
    gestureRef.current.moved = false
    gestureRef.current.actionTaken = false
    gestureRef.current.startAt = e.timeStamp
    gestureRef.current.startX = e.screenX
    gestureRef.current.startY = e.screenY
  }, [])

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (layoutRef.current !== 'mobile') {
      if (!pcDragRef.current.tracking) return
      if (e.pointerType !== 'mouse' || (e.buttons & 1) !== 1) {
        pcDragRef.current.tracking = false
        return
      }

      const dx = e.screenX - pcDragRef.current.startX
      const dy = e.screenY - pcDragRef.current.startY

      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) pcDragRef.current.moved = true

      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= 24) {
        pcDragRef.current.actionTaken = true
        pcDragRef.current.tracking = false
        if (dy <= -24) {
          setMobileBarVisible(true)
        } else {
          setMobileBarVisible(false)
          setMobilePanel(null)
        }
        return
      }

      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= 16) {
        pcDragRef.current.tracking = false
        return
      }

      if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy)) {
        pcDragRef.current.actionTaken = true
        pcDragRef.current.tracking = false
        if (dx > 0) readerRef.current?.prevPage()
        else readerRef.current?.nextPage()
      }
      return
    }

    if (!gestureRef.current.tracking) return
    const dx = e.screenX - gestureRef.current.startX
    const dy = e.screenY - gestureRef.current.startY

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) gestureRef.current.moved = true
    if (Math.abs(dy) < 8) return

    if (Math.abs(dy) < Math.abs(dx)) {
      if (Math.abs(dx) >= 8) gestureRef.current.tracking = false
      return
    }

    if (dy <= -24) {
      gestureRef.current.actionTaken = true
      gestureRef.current.tracking = false
      setMobileBarVisible(true)
      return
    }
    if (dy >= 24) {
      gestureRef.current.actionTaken = true
      gestureRef.current.tracking = false
      setMobileBarVisible(false)
      setMobilePanel(null)
    }
  }, [])

  const onPointerEnd = useCallback((e: PointerEvent) => {
    if (layoutRef.current !== 'mobile') {
      if (pcDragRef.current.actionTaken) {
        pcDragRef.current.tracking = false
        pcDragRef.current.moved = false
        pcDragRef.current.actionTaken = false
        return
      }

      if (!pcDragRef.current.tracking) {
        pcDragRef.current.moved = false
        return
      }

      const dx = e.screenX - pcDragRef.current.startX
      const dy = e.screenY - pcDragRef.current.startY
      const dt = e.timeStamp - pcDragRef.current.startAt
      const isTap = !pcDragRef.current.moved && Math.hypot(dx, dy) <= 10 && dt <= 300
      if (isTap) {
        setMobileBarVisible((prev) => {
          const next = !prev
          if (!next) setMobilePanel(null)
          return next
        })
      }

      pcDragRef.current.tracking = false
      pcDragRef.current.moved = false
      pcDragRef.current.actionTaken = false
      return
    }

    if (gestureRef.current.actionTaken) {
      gestureRef.current.tracking = false
      gestureRef.current.moved = false
      gestureRef.current.actionTaken = false
      return
    }

    if (!gestureRef.current.tracking) {
      gestureRef.current.moved = false
      return
    }

    const dx = e.screenX - gestureRef.current.startX
    const dy = e.screenY - gestureRef.current.startY
    const dt = e.timeStamp - gestureRef.current.startAt
    const isTap = !gestureRef.current.moved && Math.hypot(dx, dy) <= 10 && dt <= 300

    if (isTap) {
      setMobileBarVisible((prev) => {
        const next = !prev
        if (!next) setMobilePanel(null)
        return next
      })
    }

    gestureRef.current.tracking = false
    gestureRef.current.moved = false
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.addEventListener('pointerdown', onPointerDown)
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerup', onPointerEnd)
    root.addEventListener('pointercancel', onPointerEnd)

    return () => {
      root.removeEventListener('pointerdown', onPointerDown)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerup', onPointerEnd)
      root.removeEventListener('pointercancel', onPointerEnd)
    }
  }, [onPointerDown, onPointerMove, onPointerEnd])

  const setDarkModeInternal = useCallback(
    (next: boolean) => {
      if (controlledDarkMode == null) setUncontrolledDarkMode(next)
      onDarkModeChange?.(next)
      readerRef.current?.setDarkMode(next)
    },
    [controlledDarkMode, onDarkModeChange],
  )

  const setFontSizeInternal = useCallback(
    (next: number) => {
      const safe = clamp(next, 50, 300)
      if (controlledFontSize == null) setUncontrolledFontSize(safe)
      onFontSizeChange?.(safe)
      readerRef.current?.setFontSize(safe)
    },
    [controlledFontSize, onFontSizeChange],
  )

  const setLineHeightInternal = useCallback(
    (next: number) => {
      const safe = clamp(next, 1, 3)
      if (controlledLineHeight == null) setUncontrolledLineHeight(safe)
      onLineHeightChange?.(safe)
      readerRef.current?.setLineHeight(safe)
    },
    [controlledLineHeight, onLineHeightChange],
  )

  const setLetterSpacingInternal = useCallback(
    (next: number) => {
      const safe = clamp(next, 0, 0.3)
      if (controlledLetterSpacing == null) setUncontrolledLetterSpacing(safe)
      onLetterSpacingChange?.(safe)
      readerRef.current?.setLetterSpacing(safe)
    },
    [controlledLetterSpacing, onLetterSpacingChange],
  )

  const closePanels = useCallback(() => {
    setMobilePanel(null)
  }, [])

  const prepareOpen = useCallback(() => {
    setStatus('opening')
    setErrorText('')
    setToc([])
    setProgressInfo(null)
    setIsSeeking(false)
    setSeekPercent(0)
    setSearch((prev) => ({ ...prev, results: [], progressPercent: 0, searching: false }))
  }, [])

  const handleOpenFile = useCallback(
    async (nextFile: File) => {
      const reader = readerRef.current
      if (!reader) return

      prepareOpen()

      try {
        await reader.open(nextFile)
        setStatus('ready')
      } catch (e: any) {
        setStatus('error')
        setErrorText(e?.message ? String(e.message) : '打开失败')
        onError?.(e)
      }
    },
    [onError, prepareOpen],
  )

  const runSearch = useCallback(
    async (query: string) => {
      const reader = readerRef.current
      const normalized = query.trim()

      setSearch((prev) => ({
        ...prev,
        query,
        results: normalized ? prev.results : [],
        progressPercent: 0,
        searching: Boolean(normalized),
      }))

      if (!reader || !normalized) {
        reader?.clearSearch()
        return
      }

      reader.cancelSearch()
      try {
        const results = await reader.search(normalized, search.options)
        setSearch((prev) => ({ ...prev, results, searching: false, progressPercent: 100 }))
      } catch (e) {
        setSearch((prev) => ({ ...prev, searching: false }))
        onError?.(e)
      }
    },
    [onError, search.options],
  )

  // 初始化阅读器 Core
  useEffect(() => {
    const host = viewerHostRef.current
    if (!host) return

    try {
      const reader = createEBookReader(host, {
        darkMode,
        fontSize,
        lineHeight,
        letterSpacing,
        onReady: (h) => onReady?.(h),
        onError: (e) => onError?.(e),
        onProgress: (info) => {
          setProgressInfo(info)
          if (!isDraggingRef.current) {
            setIsSeeking(false)
          }
          onProgress?.(info)
        },
        onToc: (items) => setToc(items),
        onSearchProgress: (info) => {
          const p = info.progress
          if (typeof p === 'number') setSearch((prev) => ({ ...prev, progressPercent: Math.round(p * 100) }))
        },
        onContentLoad: (doc) => {
          if (boundDocsRef.current.has(doc)) return
          boundDocsRef.current.add(doc)
          doc.addEventListener('pointerdown', onPointerDown)
          doc.addEventListener('pointermove', onPointerMove)
          doc.addEventListener('pointerup', onPointerEnd)
          doc.addEventListener('pointercancel', onPointerEnd)
        },
      })
      readerRef.current = reader
      setStatus('ready')
    } catch (e: any) {
      setStatus('error')
      setErrorText(e?.message ? String(e.message) : '初始化失败')
      onError?.(e)
      return
    }

    return () => {
      readerRef.current?.destroy()
      readerRef.current = null
    }
  }, [onError, onProgress, onReady])

  useEffect(() => {
    if (file) {
      void handleOpenFile(file)
      return
    }

    const nextUrl = fileUrl?.trim()
    if (!nextUrl) return

    const controller = new AbortController()
    prepareOpen()
    setDownloadLoading('download')
    let active = true
    void (async () => {
      try {
        const downloaded = await downloadEpubAsFile(nextUrl, controller.signal)
        if (!active) return
        setDownloadLoading('open')
        await handleOpenFile(downloaded)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setStatus('error')
        setErrorText(e?.message ? String(e.message) : '下载失败')
        onError?.(e)
      } finally {
        if (active) setDownloadLoading(null)
      }
    })()

    return () => {
      active = false
      setDownloadLoading(null)
      controller.abort()
    }
  }, [file, fileUrl, handleOpenFile, onError, prepareOpen])

  useEffect(() => {
    readerRef.current?.setDarkMode(darkMode)
  }, [darkMode])

  useEffect(() => {
    readerRef.current?.setFontSize(fontSize)
  }, [fontSize])

  useEffect(() => {
    readerRef.current?.setLineHeight(lineHeight)
  }, [lineHeight])

  useEffect(() => {
    readerRef.current?.setLetterSpacing(letterSpacing)
  }, [letterSpacing])

  // 键盘导航
  useEffect(() => {
    if (!enableKeyboardNav) return
    const root = rootRef.current
    if (!root) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') readerRef.current?.prevPage()
      if (e.key === 'ArrowRight') readerRef.current?.nextPage()
      if (e.key === 'Escape') closePanels()
    }

    root.addEventListener('keydown', handleKeyDown)
    return () => {
      root.removeEventListener('keydown', handleKeyDown)
    }
  }, [closePanels, enableKeyboardNav])

  useImperativeHandle(
    ref,
    () => ({
      prevPage: () => readerRef.current?.prevPage(),
      nextPage: () => readerRef.current?.nextPage(),
      prevSection: () => readerRef.current?.prevSection(),
      nextSection: () => readerRef.current?.nextSection(),
      goTo: (target) => readerRef.current?.goTo(target),
      goToFraction: (frac) => readerRef.current?.goToFraction(frac),
      search: (q, o) => (readerRef.current ? readerRef.current.search(q, o) : Promise.resolve([])),
      cancelSearch: () => readerRef.current?.cancelSearch(),
      clearSearch: () => readerRef.current?.clearSearch(),
    }),
    [],
  )

  // 子组件回调 Helpers
  const handleSeekStart = useCallback(() => {
    setIsSeeking(true)
    isDraggingRef.current = true
  }, [])
  const handleSeekChange = useCallback((v: number) => setSeekPercent(v), [])
  const handleSeekEnd = useCallback((v: number) => {
    isDraggingRef.current = false
    readerRef.current?.goToFraction(v / 100)
  }, [])

  const handleTocSelect = useCallback((href?: string) => {
    if (href) readerRef.current?.goTo(href)
  }, [])

  const handleSearchResultSelect = useCallback((cfi: string) => {
    if (cfi) readerRef.current?.goTo(cfi)
  }, [])

  const rootStyle = useMemo(() => {
    if (!themeColor) return style
    return {
      ...style,
      ['--epub-reader-accent' as any]: themeColor,
    }
  }, [style, themeColor])

  return (
    <div
      ref={rootRef}
      className={mergeClassName('epub-reader', className)}
      style={rootStyle}
      data-theme={darkMode ? 'dark' : 'light'}
      data-layout={layout}
      tabIndex={0}
      aria-busy={downloadLoading != null}
    >
      <div className="epub-reader__viewer" ref={viewerHostRef} />

      {downloadLoading ? (
        <div className="epub-reader__loading" role="status" aria-live="polite">
          <div className="epub-reader__spinner" aria-hidden="true" />
          <div className="epub-reader__loading-text">{downloadLoading === 'download' ? '加载中…' : '渲染中…'}</div>
        </div>
      ) : null}

      <MobileUI
        barVisible={mobileBarVisible}
        activePanel={mobilePanel}
        onTogglePanel={toggleMobilePanel}
        onClosePanel={closeMobileSheet}
        toolbarRight={mobileToolbarRight}
        onPrevSection={() => readerRef.current?.prevSection()}
        onPrevPage={() => readerRef.current?.prevPage()}
        onNextPage={() => readerRef.current?.nextPage()}
        onNextSection={() => readerRef.current?.nextSection()}
        toc={toc}
        search={search}
        status={status}
        errorText={errorText}
        sectionLabel={sectionLabel}
        displayedPercent={displayedPercent}
        darkMode={darkMode}
        fontSize={fontSize}
        lineHeight={lineHeight}
        letterSpacing={letterSpacing}
        onTocSelect={handleTocSelect}
        onSearch={(q) => void runSearch(q)}
        onSearchQueryChange={(v) => setSearch((prev) => ({ ...prev, query: v }))}
        onSearchOptionChange={(opt) => setSearch((prev) => ({ ...prev, options: { ...prev.options, ...opt } }))}
        onCancelSearch={() => readerRef.current?.cancelSearch()}
        onSearchResultSelect={handleSearchResultSelect}
        onSeekStart={handleSeekStart}
        onSeekChange={handleSeekChange}
        onSeekEnd={handleSeekEnd}
        onSeekCommit={handleSeekEnd}
        onToggleDarkMode={setDarkModeInternal}
        onFontSizeChange={setFontSizeInternal}
        onLineHeightChange={setLineHeightInternal}
        onLetterSpacingChange={setLetterSpacingInternal}
      />
    </div>
  )
})
