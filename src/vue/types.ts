import type { PropType } from 'vue'
import type { EBookReaderHandle, ProgressInfo, SearchOptions } from '../core/types.js'

export type MobilePanel = 'menu' | 'search' | 'progress' | 'theme' | 'font'

export type EBookReaderVueExposed = Pick<
  EBookReaderHandle,
  'prevPage' | 'nextPage' | 'prevSection' | 'nextSection' | 'goTo' | 'goToFraction' | 'search' | 'cancelSearch' | 'clearSearch'
>

export type EBookReaderVueProps = {
  file?: File | null
  defaultFontSize?: number
  fontSize?: number
  defaultDarkMode?: boolean
  darkMode?: boolean
  enableKeyboardNav?: boolean
  defaultSearchOptions?: SearchOptions
}

export const EBookReaderVuePropsDef = {
  file: { type: Object as PropType<File | null>, required: false },
  defaultFontSize: { type: Number, required: false, default: 100 },
  fontSize: { type: Number, required: false },
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
  (e: 'darkModeChange', darkMode: boolean): void
  (e: 'update:fontSize', fontSize: number): void
  (e: 'update:darkMode', darkMode: boolean): void
}
