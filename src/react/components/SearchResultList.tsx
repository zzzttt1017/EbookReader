import type { SearchResult } from '../../core/types.js'

type SearchResultListProps = {
  results: SearchResult[]
  onSelect: (cfi: string) => void
}

/**
 * 搜索结果列表组件
 */
export const SearchResultList = ({ results, onSelect }: SearchResultListProps) => {
  return (
    <ul className="epub-reader__search-list">
      {results.map((r, idx) => (
        <li key={`${r.cfi ?? 'no-cfi'}-${idx}`} className="epub-reader__search-item">
          <button
            type="button"
            className="epub-reader__search-btn"
            onClick={() => {
              if (r.cfi) onSelect(r.cfi)
            }}
          >
            {r.label ? <div className="epub-reader__search-label">{r.label}</div> : null}
            <div className="epub-reader__search-excerpt">
              {typeof r.excerpt === 'string'
                ? r.excerpt
                : `${r.excerpt?.pre ?? ''}${r.excerpt?.match ?? ''}${r.excerpt?.post ?? ''}`}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
