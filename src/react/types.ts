import type { CSSProperties, ReactNode } from 'react'
import type { EBookReaderHandle, ProgressInfo, SearchOptions, SearchResult } from '../core/types.js'

export type SearchState = {
  query: string
  options: SearchOptions
  progressPercent: number
  searching: boolean
  results: SearchResult[]
}

export type MobilePanel = 'menu' | 'search' | 'progress' | 'settings'

export type EBookReaderReactHandle = Pick<
  EBookReaderHandle,
  'prevPage' | 'nextPage' | 'prevSection' | 'nextSection' | 'goTo' | 'goToFraction' | 'search' | 'cancelSearch' | 'clearSearch'
>

export type EBookReaderReactProps = {
  file?: File | null
  fileUrl?: string | null
  className?: string
  style?: CSSProperties
  themeColor?: string
  mobileToolbarRight?: ReactNode
  defaultFontSize?: number
  fontSize?: number
  onFontSizeChange?: (fontSize: number) => void
  defaultLineHeight?: number
  lineHeight?: number
  onLineHeightChange?: (lineHeight: number) => void
  defaultLetterSpacing?: number
  letterSpacing?: number
  onLetterSpacingChange?: (letterSpacing: number) => void
  defaultDarkMode?: boolean
  darkMode?: boolean
  onDarkModeChange?: (darkMode: boolean) => void
  enableKeyboardNav?: boolean
  defaultSearchOptions?: SearchOptions
  onReady?: (handle: EBookReaderHandle) => void
  onError?: (error: unknown) => void
  onProgress?: (info: ProgressInfo) => void
}
