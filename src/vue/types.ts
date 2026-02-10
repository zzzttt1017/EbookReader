import type { PropType } from 'vue'
import type { EBookReaderHandle, ProgressInfo, SearchOptions } from '../core/types.js'

export type MobilePanel = 'menu' | 'search' | 'progress' | 'settings'

export type EBookReaderVueExposed = Pick<
  EBookReaderHandle,
  'prevPage' | 'nextPage' | 'prevSection' | 'nextSection' | 'goTo' | 'goToFraction' | 'search' | 'cancelSearch' | 'clearSearch'
>

export type EBookReaderVueProps = {
  file?: File | null
  fileUrl?: string | null
  themeColor?: string
  defaultFontSize?: number
  fontSize?: number
  defaultLineHeight?: number
  lineHeight?: number
  defaultLetterSpacing?: number
  letterSpacing?: number
  defaultDarkMode?: boolean
  darkMode?: boolean
  enableKeyboardNav?: boolean
  defaultSearchOptions?: SearchOptions
}

export const EBookReaderVuePropsDef = {
  file: { type: Object as PropType<File | null>, required: false },
  fileUrl: { type: String, required: false },
  themeColor: { type: String, required: false },
  defaultFontSize: { type: Number, required: false, default: 100 },
  fontSize: { type: Number, required: false },
  defaultLineHeight: { type: Number, required: false, default: 1.6 },
  lineHeight: { type: Number, required: false },
  defaultLetterSpacing: { type: Number, required: false, default: 0 },
  letterSpacing: { type: Number, required: false },
  defaultDarkMode: { type: Boolean, required: false, default: false },
  darkMode: { type: Boolean, required: false },
  enableKeyboardNav: { type: Boolean, required: false, default: true },
  defaultSearchOptions: {
    type: Object as PropType<SearchOptions>,
    required: false,
    default: () => ({ matchCase: false, wholeWords: false, matchDiacritics: false }),
  },
} as const

export type EBookReaderVueEmits = {
  (e: 'ready', handle: EBookReaderHandle): void
  (e: 'error', error: unknown): void
  (e: 'progress', info: ProgressInfo): void
  (e: 'fontSizeChange', fontSize: number): void
  (e: 'lineHeightChange', lineHeight: number): void
  (e: 'letterSpacingChange', letterSpacing: number): void
  (e: 'darkModeChange', darkMode: boolean): void
  (e: 'update:fontSize', fontSize: number): void
  (e: 'update:lineHeight', lineHeight: number): void
  (e: 'update:letterSpacing', letterSpacing: number): void
  (e: 'update:darkMode', darkMode: boolean): void
}
