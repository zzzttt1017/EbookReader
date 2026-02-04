import { useMemo } from 'react'
import { icons } from '../../core/icons'

export type SvgIconProps = {
  name: string
  size?: number | string
  color?: string
  className?: string
}

export const SvgIcon = ({ name, size = 24, color = 'currentColor', className }: SvgIconProps) => {
  const iconPath = icons[name] || ''

  const style = useMemo(() => {
    const sizeVal = typeof size === 'number' ? `${size}px` : size
    return {
      width: sizeVal,
      height: sizeVal,
      color: color,
      minWidth: sizeVal,
      display: 'inline-block',
      verticalAlign: 'middle',
    }
  }, [size, color])

  if (!iconPath) return null

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      className={className}
      dangerouslySetInnerHTML={{ __html: iconPath }}
    />
  )
}
