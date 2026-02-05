import type { TocItem } from '../../core/types.js'
import { TocTree } from './TocTree'
import { SvgIcon } from './SvgIcon'

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
    <aside className={`epub-reader__drawer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <div className="epub-reader__drawer-header">
        <div className="epub-reader__drawer-title">目录</div>
        <button type="button" className="epub-reader__btn" onClick={onClose}>
          <SvgIcon name="x" />
        </button>
      </div>
      <div className="epub-reader__drawer-body">
        {toc.length ? (
          <TocTree
            items={toc}
            onSelect={(href) => {
              onSelect(href)
              onClose()
            }}
          />
        ) : (
          <div className="epub-reader__empty">未找到目录</div>
        )}
      </div>
    </aside>
  )
}
