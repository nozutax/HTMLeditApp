import type { HoverInfo } from './IframeEditor'

interface HoverOverlayProps {
  hover: HoverInfo | null
  /** 選択中の要素と重なっているときは表示しない */
  suppressed?: boolean
}

export function HoverOverlay({ hover, suppressed = false }: HoverOverlayProps) {
  if (!hover || suppressed) return null

  const { rect, label } = hover

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-sm border border-dashed border-blue-400"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    >
      <span className="absolute -top-5 left-0 rounded bg-blue-400 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {label}
      </span>
    </div>
  )
}
