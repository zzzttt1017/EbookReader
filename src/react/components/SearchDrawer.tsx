import type { SearchState } from '../types.js'
import { SearchResultList } from './SearchResultList'

type SearchDrawerProps = {
  isOpen: boolean
  onClose: () => void
  status: 'idle' | 'ready' | 'opening' | 'error'
  search: SearchState
  onSearch: (query: string) => void
  onQueryChange: (query: string) => void
  onOptionChange: (opt: Partial<SearchState['options']>) => void
  onCancelSearch: () => void
  onResultSelect: (cfi: string) => void
}

/**
 * 搜索侧边栏组件
 */
export const SearchDrawer = ({
  isOpen,
  onClose,
  status,
  search,
  onSearch,
  onQueryChange,
  onOptionChange,
  onCancelSearch,
  onResultSelect,
}: SearchDrawerProps) => {
  return (
    <aside className={`ebook-reader__drawer right ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="ebook-reader__drawer-header">
        <div className="ebook-reader__drawer-title">搜索</div>
        <button type="button" className="ebook-reader__btn" onClick={onClose}>
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
              onQueryChange(v)
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
              onChange={(e) => onOptionChange({ matchCase: e.target.checked })}
            />
            区分大小写
          </label>
          <label className="ebook-reader__check">
            <input
              type="checkbox"
              checked={Boolean(search.options.wholeWords)}
              onChange={(e) => onOptionChange({ wholeWords: e.target.checked })}
            />
            全词匹配
          </label>
          <label className="ebook-reader__check">
            <input
              type="checkbox"
              checked={Boolean(search.options.matchDiacritics)}
              onChange={(e) => onOptionChange({ matchDiacritics: e.target.checked })}
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
          <SearchResultList results={search.results} onSelect={onResultSelect} />
        ) : (
          <div className="ebook-reader__empty">{search.query.trim() ? '无匹配结果' : '请输入关键词'}</div>
        )}
      </div>
    </aside>
  )
}
