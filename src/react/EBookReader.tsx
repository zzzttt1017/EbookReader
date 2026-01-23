import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { createEBookReader } from '../core/reader.js'
import type { ProgressInfo, SearchOptions, SearchResult, TocItem } from '../core/types.js'
import type { EBookReaderReactHandle, EBookReaderReactProps } from './types.js'

type SearchState = {
  query: string
  options: SearchOptions
  progressPercent: number
  searching: boolean
  results: SearchResult[]
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const mergeClassName = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ')

const renderTocItems = (items: TocItem[], onSelect: (href?: string) => void) => {
  return (
    <ul className="ebook-reader__toc-list">
      {items.map((item, idx) => {
        const key = item.href || `${item.label ?? 'item'}-${idx}`
        const hasChildren = Boolean(item.subitems?.length)
        const label = item.label || item.href || '未命名'

        if (!hasChildren) {
          return (
            <li key={key} className="ebook-reader__toc-item">
              <button type="button" className="ebook-reader__toc-btn" onClick={() => onSelect(item.href)}>
                {label}
              </button>
            </li>
          )
        }

        return (
          <li key={key} className="ebook-reader__toc-item">
            <details className="ebook-reader__toc-details">
              <summary className="ebook-reader__toc-summary">{label}</summary>
              {renderTocItems(item.subitems ?? [], onSelect)}
            </details>
          </li>
        )
      })}
    </ul>
  )
}

export const EBookReader = forwardRef<EBookReaderReactHandle, EBookReaderReactProps>(function EBookReader(
  {
    file,
    className,
    style,
    defaultFontSize = 100,
    fontSize: controlledFontSize,
    onFontSizeChange,
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
  const [tocOpen, setTocOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPercent, setSeekPercent] = useState(0)

  const [uncontrolledFontSize, setUncontrolledFontSize] = useState(defaultFontSize)
  const [uncontrolledDarkMode, setUncontrolledDarkMode] = useState(defaultDarkMode)

  const fontSize = controlledFontSize ?? uncontrolledFontSize
  const darkMode = controlledDarkMode ?? uncontrolledDarkMode

  const [search, setSearch] = useState<SearchState>({
    query: '',
    options: defaultSearchOptions,
    progressPercent: 0,
    searching: false,
    results: [],
  })

  const percentage = useMemo(() => Math.round((progressInfo?.fraction ?? 0) * 100), [progressInfo])
  const displayedPercent = isSeeking ? seekPercent : percentage
  const sectionLabel = progressInfo?.tocItem?.label ?? ''

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

  const closeDrawers = useCallback(() => {
    setTocOpen(false)
    setSearchOpen(false)
  }, [])

  const handleOpenFile = useCallback(
    async (nextFile: File) => {
      const reader = readerRef.current
      if (!reader) return

      setStatus('opening')
      setErrorText('')
      setToc([])
      setProgressInfo(null)
      setIsSeeking(false)
      setSeekPercent(0)
      setSearch((prev) => ({ ...prev, results: [], progressPercent: 0, searching: false }))

      try {
        await reader.open(nextFile)
        setStatus('ready')
      } catch (e: any) {
        setStatus('error')
        setErrorText(e?.message ? String(e.message) : '打开失败')
        onError?.(e)
      }
    },
    [onError],
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

  useEffect(() => {
    const host = viewerHostRef.current
    if (!host) return

    try {
      const reader = createEBookReader(host, {
        darkMode,
        fontSize,
        onReady: (h) => onReady?.(h),
        onError: (e) => onError?.(e),
        onProgress: (info) => {
          setProgressInfo(info)
          onProgress?.(info)
        },
        onToc: (items) => setToc(items),
        onSearchProgress: (info) => {
          const p = info.progress
          if (typeof p === 'number') setSearch((prev) => ({ ...prev, progressPercent: Math.round(p * 100) }))
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
    if (!file) return
    void handleOpenFile(file)
  }, [file, handleOpenFile])

  useEffect(() => {
    readerRef.current?.setDarkMode(darkMode)
  }, [darkMode])

  useEffect(() => {
    readerRef.current?.setFontSize(fontSize)
  }, [fontSize])

  useEffect(() => {
    if (!enableKeyboardNav) return
    const root = rootRef.current
    if (!root) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') readerRef.current?.prevPage()
      if (e.key === 'ArrowRight') readerRef.current?.nextPage()
      if (e.key === 'Escape') closeDrawers()
    }

    root.addEventListener('keydown', handleKeyDown)
    return () => {
      root.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDrawers, enableKeyboardNav])

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

  return (
    <div
      ref={rootRef}
      className={mergeClassName('ebook-reader', className)}
      style={style}
      data-theme={darkMode ? 'dark' : 'light'}
      tabIndex={0}
    >
      <div className="ebook-reader__viewer" ref={viewerHostRef} />

      <div className="ebook-reader__toolbar">
        <div className="ebook-reader__panel">
          <button type="button" className="ebook-reader__btn" onClick={() => setTocOpen(true)} title="目录">
            目录
          </button>
          <button type="button" className="ebook-reader__btn" onClick={() => setSearchOpen(true)} title="搜索">
            搜索
          </button>
          <div className="ebook-reader__divider" />
          <button type="button" className="ebook-reader__btn" onClick={() => readerRef.current?.prevSection()} title="上一章">
            上一章
          </button>
          <button type="button" className="ebook-reader__btn" onClick={() => readerRef.current?.prevPage()} title="上一页">
            上一页
          </button>
          <button type="button" className="ebook-reader__btn" onClick={() => readerRef.current?.nextPage()} title="下一页">
            下一页
          </button>
          <button type="button" className="ebook-reader__btn" onClick={() => readerRef.current?.nextSection()} title="下一章">
            下一章
          </button>
        </div>

        <div className="ebook-reader__panel">
          <button type="button" className="ebook-reader__btn" onClick={() => setDarkModeInternal(!darkMode)} title="主题">
            {darkMode ? '亮色' : '暗黑'}
          </button>
          <div className="ebook-reader__divider" />
          <button type="button" className="ebook-reader__btn" onClick={() => setFontSizeInternal(fontSize + 10)} title="增大字号">
            A+
          </button>
          <div className="ebook-reader__font">{fontSize}%</div>
          <button type="button" className="ebook-reader__btn" onClick={() => setFontSizeInternal(fontSize - 10)} title="减小字号">
            A-
          </button>
        </div>
      </div>

      {(tocOpen || searchOpen) && <div className="ebook-reader__overlay" onClick={closeDrawers} />}

      <aside className={mergeClassName('ebook-reader__drawer', tocOpen ? 'is-open' : undefined)} aria-hidden={!tocOpen}>
        <div className="ebook-reader__drawer-header">
          <div className="ebook-reader__drawer-title">目录</div>
          <button type="button" className="ebook-reader__btn" onClick={() => setTocOpen(false)}>
            关闭
          </button>
        </div>
        <div className="ebook-reader__drawer-body">
          {toc.length ? (
            renderTocItems(toc, (href) => {
              if (href) readerRef.current?.goTo(href)
              setTocOpen(false)
            })
          ) : (
            <div className="ebook-reader__empty">未找到目录</div>
          )}
        </div>
      </aside>

      <aside className={mergeClassName('ebook-reader__drawer', 'right', searchOpen ? 'is-open' : undefined)} aria-hidden={!searchOpen}>
        <div className="ebook-reader__drawer-header">
          <div className="ebook-reader__drawer-title">搜索</div>
          <button type="button" className="ebook-reader__btn" onClick={() => setSearchOpen(false)}>
            关闭
          </button>
        </div>
        <div className="ebook-reader__drawer-body">
          <div className="ebook-reader__field">
            <input
              className="ebook-reader__input"
              placeholder="输入关键词"
              value={search.query}
              onChange={(e) => {
                const v = e.target.value
                setSearch((prev) => ({ ...prev, query: v }))
                if (!v.trim()) void runSearch('')
              }}
              disabled={status !== 'ready'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSearch(search.query)
              }}
            />
            <button type="button" className="ebook-reader__btn" onClick={() => void runSearch(search.query)} disabled={status !== 'ready'}>
              搜索
            </button>
          </div>

          <div className="ebook-reader__checks">
            <label className="ebook-reader__check">
              <input
                type="checkbox"
                checked={Boolean(search.options.matchCase)}
                onChange={(e) => setSearch((prev) => ({ ...prev, options: { ...prev.options, matchCase: e.target.checked } }))}
              />
              区分大小写
            </label>
            <label className="ebook-reader__check">
              <input
                type="checkbox"
                checked={Boolean(search.options.wholeWords)}
                onChange={(e) => setSearch((prev) => ({ ...prev, options: { ...prev.options, wholeWords: e.target.checked } }))}
              />
              全词匹配
            </label>
            <label className="ebook-reader__check">
              <input
                type="checkbox"
                checked={Boolean(search.options.matchDiacritics)}
                onChange={(e) => setSearch((prev) => ({ ...prev, options: { ...prev.options, matchDiacritics: e.target.checked } }))}
              />
              区分变音
            </label>
          </div>

          <div className="ebook-reader__meta">
            <span>进度 {search.progressPercent}%</span>
            {search.searching ? <span>搜索中…</span> : null}
            {search.searching ? (
              <button type="button" className="ebook-reader__link" onClick={() => readerRef.current?.cancelSearch()}>
                取消
              </button>
            ) : null}
          </div>

          {search.results.length ? (
            <ul className="ebook-reader__search-list">
              {search.results.map((r, idx) => (
                <li key={`${r.cfi ?? 'no-cfi'}-${idx}`} className="ebook-reader__search-item">
                  <button
                    type="button"
                    className="ebook-reader__search-btn"
                    onClick={() => {
                      if (r.cfi) readerRef.current?.goTo(r.cfi)
                    }}
                  >
                    {r.label ? <div className="ebook-reader__search-label">{r.label}</div> : null}
                    <div className="ebook-reader__search-excerpt">
                      {typeof r.excerpt === 'string'
                        ? r.excerpt
                        : `${r.excerpt?.pre ?? ''}${r.excerpt?.match ?? ''}${r.excerpt?.post ?? ''}`}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ebook-reader__empty">{search.query.trim() ? '无匹配结果' : '请输入关键词'}</div>
          )}
        </div>
      </aside>

      <div className="ebook-reader__bottom">
        <div className="ebook-reader__bottom-left">
          <span className="ebook-reader__status">{status === 'error' ? errorText || '错误' : status === 'opening' ? '正在打开…' : '就绪'}</span>
          {sectionLabel ? <span className="ebook-reader__section">{sectionLabel}</span> : null}
        </div>
        <div className="ebook-reader__bottom-right">
          <input
            className="ebook-reader__range"
            type="range"
            min={0}
            max={100}
            step={1}
            value={displayedPercent}
            onChange={(e) => {
              setIsSeeking(true)
              setSeekPercent(Number(e.target.value))
            }}
            onPointerUp={(e) => {
              const v = Number((e.target as HTMLInputElement).value)
              setIsSeeking(false)
              readerRef.current?.goToFraction(v / 100)
            }}
            onKeyUp={(e) => {
              if (e.key !== 'Enter') return
              const v = Number((e.target as HTMLInputElement).value)
              setIsSeeking(false)
              readerRef.current?.goToFraction(v / 100)
            }}
          />
          <span className="ebook-reader__percent">{displayedPercent}%</span>
        </div>
      </div>
    </div>
  )
})
