import { useEffect, useMemo, useRef } from 'react'
import type { TocItem } from '../../core/types.js'
import { SvgIcon } from './SvgIcon'

type TocTreeProps = {
  items: TocItem[]
  onSelect: (href?: string) => void
  activeHref?: string
  _resolvedActiveHref?: string // Internal: 递归传递的已解析唯一高亮项
}

const normalizeHref = (href?: string) => (href ?? '').split('#')[0]

const hasExact = (list: TocItem[], href: string): boolean =>
  list.some((it) => it.href === href || (it.subitems?.length ? hasExact(it.subitems, href) : false))

const findFirstBaseMatch = (list: TocItem[], baseHref: string): string | undefined => {
  for (const item of list) {
    if (item.href && normalizeHref(item.href) === baseHref) return item.href
    if (item.subitems?.length) {
      const found = findFirstBaseMatch(item.subitems, baseHref)
      if (found) return found
    }
  }
  return undefined
}

/**
 * 目录树组件
 * 递归渲染目录项
 */
export const TocTree = ({ items, onSelect, activeHref, _resolvedActiveHref }: TocTreeProps) => {
  const rootRef = useRef<HTMLUListElement | null>(null)

  // 计算唯一的最佳匹配项 href
  // 1. 如果有 _resolvedActiveHref (子组件)，直接使用
  // 2. 否则 (根组件)，计算最佳匹配：先尝试精确匹配，如果失败则尝试模糊匹配第一个
  const resolvedActiveHref = useMemo(() => {
    if (_resolvedActiveHref !== undefined) return _resolvedActiveHref
    if (!activeHref) return undefined

    if (hasExact(items, activeHref)) return activeHref

    // 如果没有精确匹配，回退到 base 模式，但只取第一个匹配项
    const base = normalizeHref(activeHref)
    return findFirstBaseMatch(items, base)
  }, [items, activeHref, _resolvedActiveHref])

  const isHrefMatch = (itemHref?: string) => {
    if (!resolvedActiveHref || !itemHref) return false
    return itemHref === resolvedActiveHref
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
      // 依赖 resolvedActiveHref 确保唯一
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
              <summary className={mergeClassName('epub-reader__toc-summary', isInActivePath && 'is-active')}>
                {item.href ? (
                  // 如果有 href，允许点击跳转，并阻止冒泡以避免切换展开状态
                  <span
                    className="epub-reader__toc-label"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(item.href)
                    }}
                  >
                    {label}
                  </span>
                ) : (
                  <span className="epub-reader__toc-label">{label}</span>
                )}
              </summary>
              <TocTree items={item.subitems ?? []} onSelect={onSelect} activeHref={activeHref} _resolvedActiveHref={resolvedActiveHref} />
            </details>
          </li>
        )
      })}
    </ul>
  )
}
