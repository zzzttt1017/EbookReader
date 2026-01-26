export type TocItem = {
  id?: string
  href?: string
  label?: string
  subitems?: TocItem[]
}

export type ProgressInfo = {
  fraction?: number
  location?: unknown
  tocItem?: TocItem | null
}

export type SearchResult = {
  cfi?: string
  label?: string
  excerpt?:
    | string
    | {
        pre?: string
        match?: string
        post?: string
      }
  title?: string
}

export type SearchOptions = {
  matchCase?: boolean
  matchDiacritics?: boolean
  wholeWords?: boolean
}

export type EBookReaderOptions = {
  darkMode?: boolean
  fontSize?: number
  extraContentCSS?: string
  onReady?: (handle: EBookReaderHandle) => void
  onError?: (error: unknown) => void
  onProgress?: (info: ProgressInfo) => void
  onToc?: (toc: TocItem[]) => void
  onSearchProgress?: (info: { progress?: number; done?: boolean }) => void
  onContentLoad?: (doc: Document) => void
}

export type EBookReaderHandle = {
  open: (file: File) => Promise<void>
  destroy: () => void
  prevPage: () => void
  nextPage: () => void
  prevSection: () => void
  nextSection: () => void
  goTo: (target: string) => void
  goToFraction: (fraction: number) => void
  setDarkMode: (darkMode: boolean) => void
  setFontSize: (fontSize: number) => void
  search: (query: string, options?: SearchOptions) => Promise<SearchResult[]>
  cancelSearch: () => void
  clearSearch: () => void
  getToc: () => TocItem[]
}
