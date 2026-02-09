import { useState, useRef } from 'react'
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
  
  // Data props
  toc: TocItem[]
  search: SearchState
  status: 'idle' | 'ready' | 'opening' | 'error'
  errorText: string
  sectionLabel: string
  displayedPercent: number
  darkMode: boolean
  fontSize: number
  
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
  toc,
  search,
  status,
  errorText,
  sectionLabel,
  displayedPercent,
  darkMode,
  fontSize,
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
}: MobileUIProps) => {
  const mobileTitle = activePanel === 'menu' ? '目录' : activePanel === 'search' ? '搜索' : activePanel === 'progress' ? '进度' : activePanel === 'theme' ? '明暗' : activePanel === 'font' ? '字号' : ''

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
          <SvgIcon name="sliders" />
        </button>
        <button 
          type="button" 
          className="epub-reader__btn" 
          onClick={() => togglePanelSafe('theme')} 
          aria-pressed={activePanel === 'theme'}
          onTouchStart={(e) => handleTouchStart(e, '明暗')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          title="明暗"
        >
          <SvgIcon name="sun" />
        </button>
        <button 
          type="button" 
          className="epub-reader__btn" 
          onClick={() => togglePanelSafe('font')} 
          aria-pressed={activePanel === 'font'}
          onTouchStart={(e) => handleTouchStart(e, '字号')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          title="字号"
        >
          <SvgIcon name="type" />
        </button>
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
                <button type="button" className="epub-reader__btn" onClick={() => onSearch(search.query)} disabled={status !== 'ready'}>
                  搜索
                </button>
              </div>

              <div className="epub-reader__checks">
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
              </div>

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
              <div className="epub-reader__mprogress">
                <input
                  className="epub-reader__range"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={displayedPercent}
                  onChange={(e) => {
                    onSeekStart()
                    onSeekChange(Number(e.target.value))
                  }}
                  onPointerUp={(e) => {
                    const v = Number((e.target as HTMLInputElement).value)
                    onSeekEnd(v)
                  }}
                  onKeyUp={(e) => {
                    if (e.key !== 'Enter') return
                    const v = Number((e.target as HTMLInputElement).value)
                    onSeekCommit(v)
                  }}
                />
                <div className="epub-reader__mprogress-percent">{displayedPercent}%</div>
              </div>
            </>
          ) : null}

          {activePanel === 'theme' ? (
            <button type="button" className="epub-reader__btn" onClick={() => onToggleDarkMode(!darkMode)}>
              {darkMode ? '切换到亮色' : '切换到暗黑'}
            </button>
          ) : null}

          {activePanel === 'font' ? (
            <div className="epub-reader__mfont">
              <button type="button" className="epub-reader__btn" onClick={() => onFontSizeChange(fontSize - 10)}>
                A-
              </button>
              <div className="epub-reader__font">{fontSize}%</div>
              <button type="button" className="epub-reader__btn" onClick={() => onFontSizeChange(fontSize + 10)}>
                A+
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
