import { SvgIcon } from './SvgIcon'

type DesktopToolbarProps = {
  onToggleToc: () => void
  onToggleSearch: () => void
  onPrevSection: () => void
  onPrevPage: () => void
  onNextPage: () => void
  onNextSection: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  fontSize: number
  onFontSizeChange: (size: number) => void
}

/**
 * 桌面端工具栏组件
 */
export const DesktopToolbar = ({
  onToggleToc,
  onToggleSearch,
  onPrevSection,
  onPrevPage,
  onNextPage,
  onNextSection,
  darkMode,
  onToggleDarkMode,
  fontSize,
  onFontSizeChange,
}: DesktopToolbarProps) => {
  return (
    <div className="epub-reader__toolbar">
      <div className="epub-reader__panel">
        <button type="button" className="epub-reader__btn" onClick={onToggleToc} title="目录">
          <SvgIcon name="list" />
        </button>
        <button type="button" className="epub-reader__btn" onClick={onToggleSearch} title="搜索">
          <SvgIcon name="search" />
        </button>
        <div className="epub-reader__divider" />
        <button type="button" className="epub-reader__btn" onClick={onPrevSection} title="上一章">
          <SvgIcon name="chevrons-left" />
        </button>
        <button type="button" className="epub-reader__btn" onClick={onPrevPage} title="上一页">
          <SvgIcon name="chevron-left" />
        </button>
        <button type="button" className="epub-reader__btn" onClick={onNextPage} title="下一页">
          <SvgIcon name="chevron-right" />
        </button>
        <button type="button" className="epub-reader__btn" onClick={onNextSection} title="下一章">
          <SvgIcon name="chevrons-right" />
        </button>
      </div>

      <div className="epub-reader__panel">
        <button type="button" className="epub-reader__btn" onClick={onToggleDarkMode} title="主题">
          <SvgIcon name={darkMode ? 'sun' : 'moon'} />
        </button>
        <div className="epub-reader__divider" />
        <button type="button" className="epub-reader__btn" onClick={() => onFontSizeChange(fontSize + 10)} title="增大字号">
          <SvgIcon name="plus" />
        </button>
        <div className="epub-reader__font">{fontSize}%</div>
        <button type="button" className="epub-reader__btn" onClick={() => onFontSizeChange(fontSize - 10)} title="减小字号">
          <SvgIcon name="minus" />
        </button>
      </div>
    </div>
  )
}
