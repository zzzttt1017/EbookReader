type DesktopBottomBarProps = {
  status: 'idle' | 'ready' | 'opening' | 'error'
  errorText: string
  sectionLabel: string
  displayedPercent: number
  onSeekStart: () => void
  onSeekChange: (val: number) => void
  onSeekEnd: (val: number) => void
  onSeekCommit: (val: number) => void
}

/**
 * 桌面端底部栏组件 (进度条)
 */
export const DesktopBottomBar = ({
  status,
  errorText,
  sectionLabel,
  displayedPercent,
  onSeekStart,
  onSeekChange,
  onSeekEnd,
  onSeekCommit,
}: DesktopBottomBarProps) => {
  return (
    <div className="epub-reader__bottom">
      <div className="epub-reader__bottom-left">
        <span className="epub-reader__status">
          {status === 'error' ? errorText || '错误' : status === 'opening' ? '正在打开…' : '就绪'}
        </span>
        {sectionLabel ? <span className="epub-reader__section">{sectionLabel}</span> : null}
      </div>
      <div className="epub-reader__bottom-right">
        <input
          className="epub-reader__range"
          type="range"
          min={0}
          max={100}
          step={1}
          value={displayedPercent}
          onChange={(e) => {
            onSeekStart()
            onSeekChange(Number(e.target.value))
          }}
          onPointerUp={(e) => {
            const v = Number((e.target as HTMLInputElement).value)
            onSeekEnd(v)
          }}
          onKeyUp={(e) => {
            if (e.key !== 'Enter') return
            const v = Number((e.target as HTMLInputElement).value)
            onSeekCommit(v)
          }}
        />
        <span className="epub-reader__percent">{displayedPercent}%</span>
      </div>
    </div>
  )
}
