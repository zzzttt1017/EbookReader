import { useEffect, useState, useRef } from 'react'
import type { TocItem } from '../../core/types.js'
import type { MobilePanel, SearchState } from '../types.js'
import { TocTree } from './TocTree'
import { SearchResultList } from './SearchResultList'
import { SvgIcon } from './SvgIcon'

type MobileUIProps = {
  barVisible: boolean
  activePanel: MobilePanel | null
  onTogglePanel: (panel: MobilePanel) => void
  onClosePanel: () => void
  toolbarRight?: React.ReactNode
  onPrevSection: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onNextSection: () => void
  
  // Data props
  toc: TocItem[]
  activeTocHref?: string
  search: SearchState
  status: 'idle' | 'ready' | 'opening' | 'error'
  errorText: string
  sectionLabel: string
  displayedPercent: number
  darkMode: boolean
  fontSize: number
  lineHeight: number
  letterSpacing: number
  
  // Actions
  onTocSelect: (href?: string) => void
  
  onSearch: (query: string) => void
  onSearchQueryChange: (query: string) => void
  onSearchOptionChange: (opt: Partial<SearchState['options']>) => void
  onCancelSearch: () => void
  onSearchResultSelect: (cfi: string) => void
  
  onSeekStart: () => void
  onSeekChange: (val: number) => void
  onSeekEnd: (val: number) => void
  onSeekCommit: (val: number) => void
  
  onToggleDarkMode: (val: boolean) => void
  onFontSizeChange: (val: number) => void
  onLineHeightChange: (val: number) => void
  onLetterSpacingChange: (val: number) => void
}

/**
 * 移动端 UI 组件
 * 包含底部导航栏和弹出面板
 */
export const MobileUI = ({
  barVisible,
  activePanel,
  onTogglePanel,
  onClosePanel,
  toolbarRight,
  onPrevSection,
  onPrevPage,
  onNextPage,
  onNextSection,
  toc,
  activeTocHref,
  search,
  status,
  errorText,
  sectionLabel,
  displayedPercent,
  darkMode,
  fontSize,
  lineHeight,
  letterSpacing,
  onTocSelect,
  onSearch,
  onSearchQueryChange,
  onSearchOptionChange,
  onCancelSearch,
  onSearchResultSelect,
  onSeekStart,
  onSeekChange,
  onSeekEnd,
  onSeekCommit,
  onToggleDarkMode,
  onFontSizeChange,
  onLineHeightChange,
  onLetterSpacingChange,
}: MobileUIProps) => {
  const mobileTitle = activePanel === 'menu' ? '目录' : activePanel === 'search' ? '搜索' : activePanel === 'progress' ? '进度' : activePanel === 'settings' ? '设置' : ''

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

  const displayedFontSize = Math.min(40, Math.max(10, Math.round(fontSize / 5)))
  const [fontSliderValue, setFontSliderValue] = useState(displayedFontSize)
  const [isFontDragging, setIsFontDragging] = useState(false)
  const fontDebounceRef = useRef<number | null>(null)
  const fontPendingRef = useRef(displayedFontSize)
  const fontSliderWrapRef = useRef<HTMLDivElement | null>(null)
  const [fontSliderWidth, setFontSliderWidth] = useState(0)
  const lineHeightSliderWrapRef = useRef<HTMLDivElement | null>(null)
  const [lineHeightSliderWidth, setLineHeightSliderWidth] = useState(0)
  const [isLineHeightDragging, setIsLineHeightDragging] = useState(false)
  const letterSpacingSliderWrapRef = useRef<HTMLDivElement | null>(null)
  const [letterSpacingSliderWidth, setLetterSpacingSliderWidth] = useState(0)
  const [isLetterSpacingDragging, setIsLetterSpacingDragging] = useState(false)
  const progressSliderWrapRef = useRef<HTMLDivElement | null>(null)
  const [progressSliderWidth, setProgressSliderWidth] = useState(0)
  const [isProgressDragging, setIsProgressDragging] = useState(false)
  const fontMin = 10
  const fontMax = 40
  const settingThumbSize = 32

  useEffect(() => {
    setFontSliderValue(displayedFontSize)
    fontPendingRef.current = displayedFontSize
  }, [displayedFontSize])

  useEffect(() => {
    return () => {
      if (fontDebounceRef.current) {
        clearTimeout(fontDebounceRef.current)
        fontDebounceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (activePanel !== 'settings') return
    const ros: ResizeObserver[] = []

    const setup = (el: HTMLElement | null, setWidth: (w: number) => void) => {
      if (!el) return
      const update = () => setWidth(el.getBoundingClientRect().width)
      update()
      const ro = new ResizeObserver(() => update())
      ro.observe(el)
      ros.push(ro)
    }

    setup(fontSliderWrapRef.current, setFontSliderWidth)
    setup(lineHeightSliderWrapRef.current, setLineHeightSliderWidth)
    setup(letterSpacingSliderWrapRef.current, setLetterSpacingSliderWidth)

    return () => ros.forEach((r) => r.disconnect())
  }, [activePanel])

  useEffect(() => {
    if (activePanel !== 'progress') return
    const el = progressSliderWrapRef.current
    if (!el) return

    const update = () => setProgressSliderWidth(el.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    return () => ro.disconnect()
  }, [activePanel])

  const fontThumbLeft = (() => {
    if (!fontSliderWidth) return 0
    const percent = (fontSliderValue - fontMin) / (fontMax - fontMin)
    const half = settingThumbSize / 2
    return Math.min(fontSliderWidth - half, Math.max(half, half + percent * (fontSliderWidth - settingThumbSize)))
  })()

  const lineHeightMin = 1
  const lineHeightMax = 3
  const lineHeightProgressPercent = clamp(((lineHeight - lineHeightMin) / (lineHeightMax - lineHeightMin)) * 100, 0, 100)
  const letterSpacingMin = 0
  const letterSpacingMax = 0.3
  const letterSpacingProgressPercent = clamp(((letterSpacing - letterSpacingMin) / (letterSpacingMax - letterSpacingMin)) * 100, 0, 100)

  const lineHeightThumbLeft = (() => {
    if (!lineHeightSliderWidth) return 0
    const half = settingThumbSize / 2
    return Math.min(lineHeightSliderWidth - half, Math.max(half, half + (lineHeightProgressPercent / 100) * (lineHeightSliderWidth - settingThumbSize)))
  })()

  const letterSpacingThumbLeft = (() => {
    if (!letterSpacingSliderWidth) return 0
    const half = settingThumbSize / 2
    return Math.min(
      letterSpacingSliderWidth - half,
      Math.max(half, half + (letterSpacingProgressPercent / 100) * (letterSpacingSliderWidth - settingThumbSize)),
    )
  })()

  const progressThumbLeft = (() => {
    if (!progressSliderWidth) return 0
    const half = settingThumbSize / 2
    const percent = clamp(displayedPercent / 100, 0, 1)
    return Math.min(progressSliderWidth - half, Math.max(half, half + percent * (progressSliderWidth - settingThumbSize)))
  })()

  const flushFontSize = () => {
    if (fontDebounceRef.current) {
      clearTimeout(fontDebounceRef.current)
      fontDebounceRef.current = null
    }
    onFontSizeChange(fontPendingRef.current * 5)
  }

  const scheduleFontSize = (next: number) => {
    fontPendingRef.current = next
    if (fontDebounceRef.current) clearTimeout(fontDebounceRef.current)
    fontDebounceRef.current = window.setTimeout(() => {
      fontDebounceRef.current = null
      onFontSizeChange(fontPendingRef.current * 5)
    }, 80)
  }

  const [tooltip, setTooltip] = useState<{ text: string, left: number } | null>(null)
  const timerRef = useRef<number | null>(null)
  const ignoreToggleRef = useRef(false)

  const markIgnoreToggle = () => {
    ignoreToggleRef.current = true
    window.setTimeout(() => {
      ignoreToggleRef.current = false
    }, 350)
  }

  const closePanelSafe = () => {
    onClosePanel()
    handleTouchEnd()
    const el = document.activeElement
    if (el && el instanceof HTMLElement) el.blur()
  }

  const togglePanelSafe = (panel: MobilePanel) => {
    if (ignoreToggleRef.current) return
    onTogglePanel(panel)
  }

  const handleTouchStart = (e: React.TouchEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // 长按 500ms 后显示提示
    timerRef.current = window.setTimeout(() => {
      setTooltip({
        text,
        left: rect.left + rect.width / 2
      })
    }, 500)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setTooltip(null)
  }

  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startY: 0, currentY: 0, isDragging: false })

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    handleTouchEnd()
    dragRef.current.startY = e.touches[0].clientY
    dragRef.current.isDragging = true
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
    }
  }

  const handleHeaderTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.isDragging) return
    e.preventDefault()
    const deltaY = e.touches[0].clientY - dragRef.current.startY
    if (deltaY > 0 && sheetRef.current) {
      // 允许跟随手指下滑
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
      dragRef.current.currentY = deltaY
    }
  }

  const handleHeaderTouchEnd = () => {
    if (!dragRef.current.isDragging) return
    dragRef.current.isDragging = false
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = '' // 恢复 CSS 中的 transition
      
      // 如果下滑距离超过 80px，则关闭
      if (dragRef.current.currentY > 80) {
        markIgnoreToggle()
        closePanelSafe()
        // 稍微延迟清空 transform，避免闪烁，等待 CSS 类移除动画接管（或者直接依赖 is-open 类移除）
        // 这里 onClosePanel 会导致 activePanel 变 null，React 重新渲染，is-open 类移除
        // 下次打开时，activePanel 变为非 null，is-open 类添加，且 style 为空（重新渲染重置）
        // 但为了保险，手动重置一下 style，防止重新挂载前的动画问题
        setTimeout(() => {
          if (sheetRef.current) sheetRef.current.style.transform = ''
        }, 300)
      } else {
        // 回弹
        sheetRef.current.style.transform = ''
      }
    }
    dragRef.current.currentY = 0
  }

  return (
    <>
      <div className={`epub-reader__mbar ${barVisible ? 'is-visible' : ''}`}>
        {tooltip && (
          <div 
            className="epub-reader__tooltip" 
            style={{ 
              position: 'fixed', 
              bottom: '60px', // 位于工具栏上方
              left: tooltip.left,
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
              whiteSpace: 'nowrap'
            }}
          >
            {tooltip.text}
          </div>
        )}
        <button 
          type="button" 
          className="epub-reader__btn" 
          onClick={() => togglePanelSafe('menu')} 
          aria-pressed={activePanel === 'menu'}
          onTouchStart={(e) => handleTouchStart(e, '目录')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          title="目录"
        >
          <SvgIcon name="list" />
        </button>
        <button 
          type="button" 
          className="epub-reader__btn" 
          onClick={() => togglePanelSafe('search')} 
          aria-pressed={activePanel === 'search'}
          onTouchStart={(e) => handleTouchStart(e, '搜索')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          title="搜索"
        >
          <SvgIcon name="search" />
        </button>
        <button 
          type="button" 
          className="epub-reader__btn" 
          onClick={() => togglePanelSafe('progress')} 
          aria-pressed={activePanel === 'progress'}
          onTouchStart={(e) => handleTouchStart(e, '进度')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          title="进度"
        >
          <SvgIcon name="progress" />
        </button>
        <button 
          type="button" 
          className="epub-reader__btn" 
          onClick={() => togglePanelSafe('settings')} 
          aria-pressed={activePanel === 'settings'}
          onTouchStart={(e) => handleTouchStart(e, '设置')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          title="设置"
        >
          <SvgIcon name="settings" />
        </button>

        {toolbarRight ?? null}
      </div>

      {activePanel ? <div className="epub-reader__moverlay" onClick={closePanelSafe} /> : null}

      <div 
        ref={sheetRef}
        className={`epub-reader__msheet ${activePanel ? 'is-open' : ''}`} 
        aria-hidden={!activePanel}
      >
        <div 
          className="epub-reader__msheet-header"
          onTouchStart={handleHeaderTouchStart}
          onTouchMove={handleHeaderTouchMove}
          onTouchEnd={handleHeaderTouchEnd}
        >
          <div className="epub-reader__msheet-title">{mobileTitle}</div>
          <button type="button" className="epub-reader__btn" onClick={closePanelSafe}>
            <SvgIcon name="x" />
          </button>
        </div>
        <div className="epub-reader__msheet-body">
          {activePanel === 'menu' ? (
            toc.length ? (
              <TocTree
                items={toc}
                activeHref={activeTocHref}
                onSelect={(href) => {
                  onTocSelect(href)
                  closePanelSafe()
                }}
              />
            ) : (
              <div className="epub-reader__empty">未找到目录</div>
            )
          ) : null}

          {activePanel === 'search' ? (
            <>
              <div className="epub-reader__field">
                <input
                  className="epub-reader__input"
                  placeholder="输入关键词"
                  value={search.query}
                  onChange={(e) => {
                    const v = e.target.value
                    onSearchQueryChange(v)
                    if (!v.trim()) onSearch('')
                  }}
                  disabled={status !== 'ready'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSearch(search.query)
                  }}
                />
                <button type="button" className="epub-reader__btn epub-reader__btn--wide" onClick={() => onSearch(search.query)} disabled={status !== 'ready'}>
                  搜索
                </button>
                {search.query.trim() ? (
                  <button
                    type="button"
                    className="epub-reader__link"
                    disabled={status !== 'ready'}
                    onClick={() => {
                      onCancelSearch()
                      onSearchQueryChange('')
                      onSearch('')
                    }}
                  >
                    重置
                  </button>
                ) : null}
              </div>

              {/* <div className="epub-reader__checks">
                <label className="epub-reader__check">
                  <input
                    type="checkbox"
                    checked={Boolean(search.options.matchCase)}
                    onChange={(e) => onSearchOptionChange({ matchCase: e.target.checked })}
                  />
                  区分大小写
                </label>
                <label className="epub-reader__check">
                  <input
                    type="checkbox"
                    checked={Boolean(search.options.wholeWords)}
                    onChange={(e) => onSearchOptionChange({ wholeWords: e.target.checked })}
                  />
                  全词匹配
                </label>
                <label className="epub-reader__check">
                  <input
                    type="checkbox"
                    checked={Boolean(search.options.matchDiacritics)}
                    onChange={(e) => onSearchOptionChange({ matchDiacritics: e.target.checked })}
                  />
                  区分变音
                </label>
              </div>

              <div className="epub-reader__meta">
                <span>进度 {search.progressPercent}%</span>
                {search.searching ? <span>搜索中…</span> : null}
                {search.searching ? (
                  <button type="button" className="epub-reader__link" onClick={onCancelSearch}>
                    取消
                  </button>
                ) : null}
              </div> */}

              {search.results.length ? (
                <SearchResultList results={search.results} onSelect={onSearchResultSelect} />
              ) : (
                <div className="epub-reader__empty">{search.query.trim() ? '无匹配结果' : '请输入关键词'}</div>
              )}
            </>
          ) : null}

          {activePanel === 'progress' ? (
            <>
              <div className="epub-reader__meta">
                <span className="epub-reader__status">
                  {status === 'error' ? errorText || '错误' : status === 'opening' ? '正在打开…' : ''}
                </span>
                {sectionLabel ? <span>{sectionLabel}</span> : null}
              </div>
              <div ref={progressSliderWrapRef} className={`epub-reader__mprogress ${isProgressDragging ? 'is-dragging' : ''}`}>
                <input
                  className="epub-reader__range"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={displayedPercent}
                  style={{
                    background: `linear-gradient(to right, var(--epub-reader-range-fill) 0%, var(--epub-reader-range-fill) ${displayedPercent}%, var(--epub-reader-range-track) ${displayedPercent}%, var(--epub-reader-range-track) 100%)`,
                  }}
                  onChange={(e) => {
                    onSeekStart()
                    onSeekChange(Number(e.target.value))
                  }}
                  onPointerDown={() => setIsProgressDragging(true)}
                  onPointerUp={(e) => {
                    const v = Number((e.target as HTMLInputElement).value)
                    onSeekEnd(v)
                    setIsProgressDragging(false)
                  }}
                  onPointerCancel={() => setIsProgressDragging(false)}
                  onKeyUp={(e) => {
                    if (e.key !== 'Enter') return
                    const v = Number((e.target as HTMLInputElement).value)
                    onSeekCommit(v)
                  }}
                  onTouchStart={() => setIsProgressDragging(true)}
                  onTouchEnd={(e) => {
                    const v = Number((e.target as HTMLInputElement).value)
                    onSeekEnd(v)
                    setIsProgressDragging(false)
                  }}
                  onTouchCancel={() => setIsProgressDragging(false)}
                />
                <div
                  className="epub-reader__mprogress-thumb"
                  style={{ left: `${progressThumbLeft}px`, width: `${settingThumbSize}px`, height: `${settingThumbSize}px` }}
                >
                  {displayedPercent}%
                </div>
              </div>

              <div className="epub-reader__mnav">
                <button
                  type="button"
                  className="epub-reader__btn"
                  onClick={onPrevSection}
                  onTouchStart={(e) => handleTouchStart(e, '上一章')}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  title="上一章"
                >
                  <SvgIcon name="chevrons-left" />
                </button>
                <button
                  type="button"
                  className="epub-reader__btn"
                  onClick={onPrevPage}
                  onTouchStart={(e) => handleTouchStart(e, '上一页')}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  title="上一页"
                >
                  <SvgIcon name="chevron-left" />
                </button>
                <button
                  type="button"
                  className="epub-reader__btn"
                  onClick={onNextPage}
                  onTouchStart={(e) => handleTouchStart(e, '下一页')}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  title="下一页"
                >
                  <SvgIcon name="chevron-right" />
                </button>
                <button
                  type="button"
                  className="epub-reader__btn"
                  onClick={onNextSection}
                  onTouchStart={(e) => handleTouchStart(e, '下一章')}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  title="下一章"
                >
                  <SvgIcon name="chevrons-right" />
                </button>
              </div>
            </>
          ) : null}

          {activePanel === 'settings' ? (
            <div className="epub-reader__msettings">
              <div className="epub-reader__msettings-row">
                <div className="epub-reader__msetting">
                  <div ref={fontSliderWrapRef} className={`epub-reader__mslider ${isFontDragging ? 'is-dragging' : ''}`}>
                    <div className="epub-reader__mslider-label is-left smaller">A</div>
                    <div className="epub-reader__mslider-label is-right larger">A</div>
                    <input
                      className="epub-reader__range"
                      type="range"
                      min={fontMin}
                      max={fontMax}
                      step={1}
                      value={fontSliderValue}
                      onChange={(e) => {
                        const next = Number(e.target.value)
                        setFontSliderValue(next)
                        scheduleFontSize(next)
                      }}
                      onPointerDown={() => setIsFontDragging(true)}
                      onPointerUp={() => {
                        setIsFontDragging(false)
                        flushFontSize()
                      }}
                      onPointerCancel={() => {
                        setIsFontDragging(false)
                        flushFontSize()
                      }}
                      onTouchStart={() => setIsFontDragging(true)}
                      onTouchEnd={() => {
                        setIsFontDragging(false)
                        flushFontSize()
                      }}
                      onTouchCancel={() => {
                        setIsFontDragging(false)
                        flushFontSize()
                      }}
                      onKeyUp={(e) => {
                        if (e.key !== 'Enter') return
                        flushFontSize()
                      }}
                      aria-label="字号"
                    />
                    <div className="epub-reader__mslider-thumb" style={{ left: `${fontThumbLeft}px`, width: `${settingThumbSize}px`, height: `${settingThumbSize}px` }}>
                      字号
                    </div>
                  </div>
                </div>
              </div>

              <div className="epub-reader__msettings-row">
                <div className="epub-reader__msetting">
                  <div ref={lineHeightSliderWrapRef} className={`epub-reader__mslider ${isLineHeightDragging ? 'is-dragging' : ''}`}>
                    <div className="epub-reader__mslider-label is-left">小</div>
                    <div className="epub-reader__mslider-label is-right">大</div>
                    <input
                      className="epub-reader__range"
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={lineHeight}
                      aria-label="行高"
                      onChange={(e) => onLineHeightChange(Number(e.target.value))}
                      onPointerDown={() => setIsLineHeightDragging(true)}
                      onPointerUp={() => setIsLineHeightDragging(false)}
                      onPointerCancel={() => setIsLineHeightDragging(false)}
                      onTouchStart={() => setIsLineHeightDragging(true)}
                      onTouchEnd={() => setIsLineHeightDragging(false)}
                      onTouchCancel={() => setIsLineHeightDragging(false)}
                    />
                    <div className="epub-reader__mslider-thumb" style={{ left: `${lineHeightThumbLeft}px`, width: `${settingThumbSize}px`, height: `${settingThumbSize}px` }}>
                      行高
                    </div>
                  </div>
                </div>

                <div className="epub-reader__msetting">
                  <div
                    ref={letterSpacingSliderWrapRef}
                    className={`epub-reader__mslider ${isLetterSpacingDragging ? 'is-dragging' : ''}`}
                  >
                    <div className="epub-reader__mslider-label is-left">紧</div>
                    <div className="epub-reader__mslider-label is-right">松</div>
                    <input
                      className="epub-reader__range"
                      type="range"
                      min={0}
                      max={0.3}
                      step={0.01}
                      value={letterSpacing}
                      aria-label="字间距"
                      onChange={(e) => onLetterSpacingChange(Number(e.target.value))}
                      onPointerDown={() => setIsLetterSpacingDragging(true)}
                      onPointerUp={() => setIsLetterSpacingDragging(false)}
                      onPointerCancel={() => setIsLetterSpacingDragging(false)}
                      onTouchStart={() => setIsLetterSpacingDragging(true)}
                      onTouchEnd={() => setIsLetterSpacingDragging(false)}
                      onTouchCancel={() => setIsLetterSpacingDragging(false)}
                    />
                    <div
                      className="epub-reader__mslider-thumb"
                      style={{ left: `${letterSpacingThumbLeft}px`, width: `${settingThumbSize}px`, height: `${settingThumbSize}px` }}
                    >
                      间距
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="epub-reader__btn"
                  aria-size="small"
                  onClick={() => onToggleDarkMode(!darkMode)}
                  aria-pressed={darkMode}
                  aria-label={darkMode ? '暗黑模式：开，点击切换到亮色' : '暗黑模式：关，点击切换到暗黑'}
                  title={darkMode ? '切换到亮色' : '切换到暗黑'}
                >
                  <SvgIcon name={darkMode ? 'sun' : 'moon'} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
