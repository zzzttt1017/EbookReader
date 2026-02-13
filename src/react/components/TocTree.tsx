import { useEffect, useMemo, useRef } from 'react'
import type { TocItem } from '../../core/types.js'
import { SvgIcon } from './SvgIcon'

type TocTreeProps = {
  items: TocItem[]
  onSelect: (href?: string) => void
  activeHref?: string
}

/**
 * 目录树组件
 * 递归渲染目录项
 */
export const TocTree = ({ items, onSelect, activeHref }: TocTreeProps) => {
  const rootRef = useRef<HTMLUListElement | null>(null)

  const normalizeHref = (href?: string) => (href ?? '').split('#')[0]

  const hasExact = (list: TocItem[], href: string): boolean =>
    list.some((it) => it.href === href || (it.subitems?.length ? hasExact(it.subitems, href) : false))

  const matchMode = useMemo<'exact' | 'base'>(() => {
    if (!activeHref) return 'base'
    return hasExact(items, activeHref) ? 'exact' : 'base'
  }, [activeHref, items])

  const isHrefMatch = (itemHref?: string) => {
    if (!activeHref || !itemHref) return false
    if (matchMode === 'exact') return itemHref === activeHref
    return normalizeHref(itemHref) === normalizeHref(activeHref)
  }

  const containsActive = (item: TocItem): boolean => {
    if (isHrefMatch(item.href)) return true
    if (!item.subitems?.length) return false
    return item.subitems.some(containsActive)
  }

  const mergeClassName = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ')

  useEffect(() => {
    if (!activeHref) return

    const raf = window.requestAnimationFrame(() => {
      const el = rootRef.current?.querySelector('[data-epub-toc-active="true"]')
      if (!(el instanceof HTMLElement)) return

      const container = el.closest<HTMLElement>('.epub-reader__drawer-body, .epub-reader__msheet-body')
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      if (containerRect.height <= 0) return

      const elRect = el.getBoundingClientRect()
      const topDelta = elRect.top - containerRect.top
      const target = container.scrollTop + topDelta - container.clientHeight / 2 + elRect.height / 2
      const nextTop = Math.max(0, Math.min(target, container.scrollHeight - container.clientHeight))
      container.scrollTop = nextTop
    })

    return () => window.cancelAnimationFrame(raf)
  }, [activeHref, items])

  return (
    <ul className="epub-reader__toc-list" ref={rootRef}>
      {items.map((item, idx) => {
        const key = item.href || `${item.label ?? 'item'}-${idx}`
        const hasChildren = Boolean(item.subitems?.length)
        const label = item.label || item.href || '未命名'

        const isActive = isHrefMatch(item.href)
        const isInActivePath = containsActive(item)

        if (!hasChildren) {
          return (
            <li key={key} className="epub-reader__toc-item">
              <button
                type="button"
                className={mergeClassName('epub-reader__toc-btn', isActive && 'is-active')}
                aria-current={isActive ? 'location' : undefined}
                data-epub-toc-active={isActive ? 'true' : undefined}
                onClick={() => onSelect(item.href)}
              >
                <span className="epub-reader__toc-label">{label}</span>
                {isActive ? <SvgIcon name="book-open" className="epub-reader__toc-active-icon" /> : null}
              </button>
            </li>
          )
        }

        return (
          <li key={key} className="epub-reader__toc-item">
            <details
              className={mergeClassName('epub-reader__toc-details', isInActivePath && 'is-active')}
              open={isInActivePath ? true : undefined}
            >
              <summary className={mergeClassName('epub-reader__toc-summary', isInActivePath && 'is-active')}>{label}</summary>
              <TocTree items={item.subitems ?? []} onSelect={onSelect} activeHref={activeHref} />
            </details>
          </li>
        )
      })}
    </ul>
  )
}
