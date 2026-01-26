import type { TocItem } from '../../core/types.js'

type TocTreeProps = {
  items: TocItem[]
  onSelect: (href?: string) => void
}

/**
 * 目录树组件
 * 递归渲染目录项
 */
export const TocTree = ({ items, onSelect }: TocTreeProps) => {
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
              <TocTree items={item.subitems ?? []} onSelect={onSelect} />
            </details>
          </li>
        )
      })}
    </ul>
  )
}
