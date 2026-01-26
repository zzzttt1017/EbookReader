import type { TocItem } from '../../core/types.js'
import { TocTree } from './TocTree'

type TocDrawerProps = {
  isOpen: boolean
  onClose: () => void
  toc: TocItem[]
  onSelect: (href?: string) => void
}

/**
 * 目录侧边栏组件
 */
export const TocDrawer = ({ isOpen, onClose, toc, onSelect }: TocDrawerProps) => {
  return (
    <aside className={`ebook-reader__drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="ebook-reader__drawer-header">
        <div className="ebook-reader__drawer-title">目录</div>
        <button type="button" className="ebook-reader__btn" onClick={onClose}>
          关闭
        </button>
      </div>
      <div className="ebook-reader__drawer-body">
        {toc.length ? (
          <TocTree
            items={toc}
            onSelect={(href) => {
              onSelect(href)
              onClose()
            }}
          />
        ) : (
          <div className="ebook-reader__empty">未找到目录</div>
        )}
      </div>
    </aside>
  )
}
