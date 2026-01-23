import 'foliate-js/view.js'
import type { EBookReaderHandle, EBookReaderOptions, ProgressInfo, SearchOptions, SearchResult, TocItem } from './types.js'

type FoliateViewElement = HTMLElement & {
  book?: { toc?: TocItem[] }
  renderer?: {
    prevSection?: () => void
    nextSection?: () => void
    setStyles?: (css: string) => void
    render?: () => void
    expand?: () => void
  }
  open?: (file: File) => Promise<void>
  init?: (options?: unknown) => Promise<void>
  goLeft?: () => void
  goRight?: () => void
  goTo?: (target: string) => Promise<void> | void
  goToFraction?: (fraction: number) => Promise<void> | void
  search?: (options: unknown) => AsyncIterable<unknown>
  clearSearch?: () => void
}

const getContentCSS = (fontSize: number, isDark: boolean, extraCSS?: string) => `
@namespace epub "http://www.idpf.org/2007/ops";
html {
  color-scheme: ${isDark ? 'dark' : 'light'} !important;
}
body {
  background-color: transparent !important;
  color: ${isDark ? '#e0e0e0' : 'black'} !important;
  font-size: ${fontSize}% !important;
}
p {
  line-height: 1.6;
  margin-bottom: 1em;
}
a {
  color: ${isDark ? '#64b5f6' : '#2563eb'} !important;
}
img {
  max-width: 100%;
  height: auto;
  object-fit: contain;
  ${isDark ? 'filter: brightness(0.8) contrast(1.2);' : ''}
}
${extraCSS ?? ''}
`

export function createEBookReader(container: HTMLElement, options: EBookReaderOptions = {}): EBookReaderHandle {
  if (!container) throw new Error('container is required')
  if (!customElements.get('foliate-view')) throw new Error('foliate-view is not defined')

  const {
    darkMode: initialDarkMode = false,
    fontSize: initialFontSize = 100,
    extraContentCSS,
    onReady,
    onError,
    onProgress,
    onToc,
    onSearchProgress,
  } = options

  let destroyed = false
  let toc: TocItem[] = []
  let fontSize = initialFontSize
  let darkMode = initialDarkMode
  let searchToken = 0

  container.innerHTML = ''

  const viewer = document.createElement('foliate-view') as FoliateViewElement
  viewer.style.display = 'block'
  viewer.style.width = '100%'
  viewer.style.height = '100%'
  viewer.setAttribute('margin', '48')
  viewer.setAttribute('gap', '0.07')

  const applyStyles = () => {
    if (destroyed) return
    if (!viewer.renderer?.setStyles) return
    viewer.renderer.setStyles(getContentCSS(fontSize, darkMode, extraContentCSS))
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (destroyed) return
        viewer.renderer?.render?.()
        viewer.renderer?.expand?.()
      }, 50)
    })
  }

  const handleLoad = () => {
    applyStyles()
  }

  const handleRelocate = (e: Event) => {
    const detail = (e as CustomEvent).detail as ProgressInfo
    onProgress?.(detail)
  }

  viewer.addEventListener('load', handleLoad)
  viewer.addEventListener('relocate', handleRelocate as EventListener)

  container.appendChild(viewer)

  const handle: EBookReaderHandle = {
    async open(file) {
      if (destroyed) return
      if (!file) return

      try {
        viewer.clearSearch?.()
        searchToken++

        await viewer.open?.(file)

        const nextToc = viewer.book?.toc ?? []
        toc = nextToc
        onToc?.(toc)

        await viewer.init?.({ showTextStart: true })
        applyStyles()
      } catch (error) {
        onError?.(error)
        throw error
      }
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      searchToken++
      viewer.removeEventListener('load', handleLoad)
      viewer.removeEventListener('relocate', handleRelocate as EventListener)
      container.innerHTML = ''
    },
    prevPage() {
      viewer.goLeft?.()
    },
    nextPage() {
      viewer.goRight?.()
    },
    prevSection() {
      viewer.renderer?.prevSection?.()
    },
    nextSection() {
      viewer.renderer?.nextSection?.()
    },
    goTo(target) {
      if (!target) return
      viewer.goTo?.(target)
    },
    goToFraction(fraction) {
      const safe = Math.min(1, Math.max(0, fraction))
      viewer.goToFraction?.(safe)
    },
    setDarkMode(nextDarkMode) {
      darkMode = nextDarkMode
      applyStyles()
    },
    setFontSize(nextFontSize) {
      const safe = Math.min(300, Math.max(50, nextFontSize))
      fontSize = safe
      applyStyles()
    },
    async search(query, opts: SearchOptions = {}) {
      const normalized = query.trim()
      if (!normalized) {
        viewer.clearSearch?.()
        return []
      }

      const token = ++searchToken
      const results: SearchResult[] = []

      try {
        for await (const item of viewer.search?.({
          query: normalized,
          matchCase: Boolean(opts.matchCase),
          matchWholeWords: Boolean(opts.wholeWords),
          matchDiacritics: Boolean(opts.matchDiacritics),
        }) ?? []) {
          if (destroyed || token !== searchToken) return results

          if (item === 'done') {
            onSearchProgress?.({ done: true, progress: 1 })
            break
          }

          if (typeof item === 'object' && item && 'progress' in (item as any)) {
            const progress = (item as any).progress
            if (typeof progress === 'number') onSearchProgress?.({ progress })
            continue
          }

          const anyItem = item as any
          if (anyItem?.subitems?.length) {
            for (const sub of anyItem.subitems) {
              results.push({
                label: anyItem.label,
                cfi: sub?.cfi,
                excerpt: sub?.excerpt,
                title: sub?.title,
              })
            }
          } else if (anyItem?.cfi) {
            results.push({
              cfi: anyItem.cfi,
              excerpt: anyItem.excerpt,
              title: anyItem.title,
            })
          }
        }
      } catch (error) {
        onError?.(error)
        throw error
      }

      return results
    },
    cancelSearch() {
      searchToken++
    },
    clearSearch() {
      viewer.clearSearch?.()
    },
    getToc() {
      return toc
    },
  }

  onReady?.(handle)
  return handle
}
