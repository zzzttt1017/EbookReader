import type { CSSProperties } from 'react'
import type { EBookReaderHandle, ProgressInfo, SearchOptions } from '../core/types.js'

export type EBookReaderReactHandle = Pick<
  EBookReaderHandle,
  'prevPage' | 'nextPage' | 'prevSection' | 'nextSection' | 'goTo' | 'goToFraction' | 'search' | 'cancelSearch' | 'clearSearch'
>

export type EBookReaderReactProps = {
  file?: File | null
  className?: string
  style?: CSSProperties
  defaultFontSize?: number
  fontSize?: number
  onFontSizeChange?: (fontSize: number) => void
  defaultDarkMode?: boolean
  darkMode?: boolean
  onDarkModeChange?: (darkMode: boolean) => void
  enableKeyboardNav?: boolean
  defaultSearchOptions?: SearchOptions
  onReady?: (handle: EBookReaderHandle) => void
  onError?: (error: unknown) => void
  onProgress?: (info: ProgressInfo) => void
}
