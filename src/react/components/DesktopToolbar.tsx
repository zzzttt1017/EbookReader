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
    <div className="ebook-reader__toolbar">
      <div className="ebook-reader__panel">
        <button type="button" className="ebook-reader__btn" onClick={onToggleToc} title="目录">
          目录！！
        </button>
        <button type="button" className="ebook-reader__btn" onClick={onToggleSearch} title="搜索">
          搜索
        </button>
        <div className="ebook-reader__divider" />
        <button type="button" className="ebook-reader__btn" onClick={onPrevSection} title="上一章">
          上一章
        </button>
        <button type="button" className="ebook-reader__btn" onClick={onPrevPage} title="上一页">
          上一页
        </button>
        <button type="button" className="ebook-reader__btn" onClick={onNextPage} title="下一页">
          下一页
        </button>
        <button type="button" className="ebook-reader__btn" onClick={onNextSection} title="下一章">
          下一章
        </button>
      </div>

      <div className="ebook-reader__panel">
        <button type="button" className="ebook-reader__btn" onClick={onToggleDarkMode} title="主题">
          {darkMode ? '亮色' : '暗黑'}
        </button>
        <div className="ebook-reader__divider" />
        <button type="button" className="ebook-reader__btn" onClick={() => onFontSizeChange(fontSize + 10)} title="增大字号">
          A+
        </button>
        <div className="ebook-reader__font">{fontSize}%</div>
        <button type="button" className="ebook-reader__btn" onClick={() => onFontSizeChange(fontSize - 10)} title="减小字号">
          A-
        </button>
      </div>
    </div>
  )
}
