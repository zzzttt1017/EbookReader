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

  return (
    <>
      <div className={`ebook-reader__mbar ${barVisible ? 'is-visible' : ''}`}>
        {tooltip && (
          <div 
            className="ebook-reader__tooltip" 
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
          className="ebook-reader__btn" 
          onClick={() => onTogglePanel('menu')} 
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
          className="ebook-reader__btn" 
          onClick={() => onTogglePanel('search')} 
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
          className="ebook-reader__btn" 
          onClick={() => onTogglePanel('progress')} 
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
          className="ebook-reader__btn" 
          onClick={() => onTogglePanel('theme')} 
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
          className="ebook-reader__btn" 
          onClick={() => onTogglePanel('font')} 
          aria-pressed={activePanel === 'font'}
          onTouchStart={(e) => handleTouchStart(e, '字号')}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          title="字号"
        >
          <SvgIcon name="type" />
        </button>
      </div>

      {activePanel ? <div className="ebook-reader__moverlay" onClick={onClosePanel} /> : null}

      <div className={`ebook-reader__msheet ${activePanel ? 'is-open' : ''}`} aria-hidden={!activePanel}>
        <div className="ebook-reader__msheet-header">
          <div className="ebook-reader__msheet-title">{mobileTitle}</div>
          <button type="button" className="ebook-reader__btn" onClick={onClosePanel}>
            <SvgIcon name="x" />
          </button>
        </div>
        <div className="ebook-reader__msheet-body">
          {activePanel === 'menu' ? (
            toc.length ? (
              <TocTree
                items={toc}
                onSelect={(href) => {
                  onTocSelect(href)
                  onClosePanel()
                }}
              />
            ) : (
              <div className="ebook-reader__empty">未找到目录</div>
            )
          ) : null}

          {activePanel === 'search' ? (
            <>
              <div className="ebook-reader__field">
                <input
                  className="ebook-reader__input"
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
                <button type="button" className="ebook-reader__btn" onClick={() => onSearch(search.query)} disabled={status !== 'ready'}>
                  搜索
                </button>
              </div>

              <div className="ebook-reader__checks">
                <label className="ebook-reader__check">
                  <input
                    type="checkbox"
                    checked={Boolean(search.options.matchCase)}
                    onChange={(e) => onSearchOptionChange({ matchCase: e.target.checked })}
                  />
                  区分大小写
                </label>
                <label className="ebook-reader__check">
                  <input
                    type="checkbox"
                    checked={Boolean(search.options.wholeWords)}
                    onChange={(e) => onSearchOptionChange({ wholeWords: e.target.checked })}
                  />
                  全词匹配
                </label>
                <label className="ebook-reader__check">
                  <input
                    type="checkbox"
                    checked={Boolean(search.options.matchDiacritics)}
                    onChange={(e) => onSearchOptionChange({ matchDiacritics: e.target.checked })}
                  />
                  区分变音
                </label>
              </div>

              <div className="ebook-reader__meta">
                <span>进度 {search.progressPercent}%</span>
                {search.searching ? <span>搜索中…</span> : null}
                {search.searching ? (
                  <button type="button" className="ebook-reader__link" onClick={onCancelSearch}>
                    取消
                  </button>
                ) : null}
              </div>

              {search.results.length ? (
                <SearchResultList results={search.results} onSelect={onSearchResultSelect} />
              ) : (
                <div className="ebook-reader__empty">{search.query.trim() ? '无匹配结果' : '请输入关键词'}</div>
              )}
            </>
          ) : null}

          {activePanel === 'progress' ? (
            <>
              <div className="ebook-reader__meta">
                <span className="ebook-reader__status">
                  {status === 'error' ? errorText || '错误' : status === 'opening' ? '正在打开…' : '就绪'}
                </span>
                {sectionLabel ? <span>{sectionLabel}</span> : null}
              </div>
              <div className="ebook-reader__mprogress">
                <input
                  className="ebook-reader__range"
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
                <div className="ebook-reader__mprogress-percent">{displayedPercent}%</div>
              </div>
            </>
          ) : null}

          {activePanel === 'theme' ? (
            <button type="button" className="ebook-reader__btn" onClick={() => onToggleDarkMode(!darkMode)}>
              {darkMode ? '切换到亮色' : '切换到暗黑'}
            </button>
          ) : null}

          {activePanel === 'font' ? (
            <div className="ebook-reader__mfont">
              <button type="button" className="ebook-reader__btn" onClick={() => onFontSizeChange(fontSize - 10)}>
                A-
              </button>
              <div className="ebook-reader__font">{fontSize}%</div>
              <button type="button" className="ebook-reader__btn" onClick={() => onFontSizeChange(fontSize + 10)}>
                A+
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
