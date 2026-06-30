import { useRef, useState } from 'react'
import type { IframeEditorHandle, SelectionInfo, SiblingRects } from './IframeEditor'
import type { OverlayRect } from '../types/editor'

interface ElementOverlayProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
  selection: SelectionInfo | null
  elementRect: OverlayRect | null
  layerRef: React.RefObject<HTMLDivElement | null>
  onOpenDetails: () => void
  onDraggingChange: (dragging: boolean) => void
}

const TEXT_BLOCK_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'li',
])

function HandleButton({
  onClick,
  title,
  children,
  variant = 'default',
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-6 min-w-6 items-center justify-center rounded text-[11px] shadow-sm transition-colors ${
        variant === 'danger'
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      {children}
    </button>
  )
}

export function ElementOverlay({
  editorRef,
  selection,
  elementRect,
  layerRef,
  onOpenDetails,
  onDraggingChange,
}: ElementOverlayProps) {
  const [dropLineY, setDropLineY] = useState<number | null>(null)
  const dragStateRef = useRef<{ siblings: SiblingRects; targetIndex: number } | null>(null)

  if (!selection || !selection.isCollapsed || !elementRect || selection.tagName === 'text') {
    return null
  }

  if (selection.tagName === 'body') return null

  const isTextBlock = TEXT_BLOCK_TAGS.has(selection.tagName)

  const run = (command: string, value?: string) => editorRef.current?.execCommand(command, value)
  const handleDuplicate = () => editorRef.current?.duplicateSelected()
  const handleRemove = () => {
    if (window.confirm('この要素を削除しますか？')) {
      editorRef.current?.removeSelected()
    }
  }

  const computeTargetIndex = (siblings: SiblingRects, pointerY: number): number => {
    let index = 0
    for (const rect of siblings.rects) {
      const mid = rect.top + rect.height / 2
      if (pointerY > mid) index += 1
    }
    return index
  }

  const dropLineForIndex = (siblings: SiblingRects, index: number): number => {
    if (index <= 0) return siblings.rects[0]!.top
    if (index >= siblings.rects.length) {
      const last = siblings.rects[siblings.rects.length - 1]!
      return last.top + last.height
    }
    return siblings.rects[index]!.top
  }

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault()
    const siblings = editorRef.current?.getSiblingRects()
    if (!siblings) return

    const layer = layerRef.current
    if (!layer) return

    dragStateRef.current = { siblings, targetIndex: siblings.currentIndex }
    onDraggingChange(true)

    const handleMove = (ev: PointerEvent) => {
      const state = dragStateRef.current
      if (!state) return
      const layerRect = layer.getBoundingClientRect()
      const pointerY = ev.clientY - layerRect.top
      const targetIndex = computeTargetIndex(state.siblings, pointerY)
      state.targetIndex = targetIndex
      setDropLineY(dropLineForIndex(state.siblings, targetIndex))
    }

    const handleUp = () => {
      const state = dragStateRef.current
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      dragStateRef.current = null
      setDropLineY(null)
      onDraggingChange(false)
      if (state && state.targetIndex !== state.siblings.currentIndex) {
        editorRef.current?.moveSelectedToIndex(state.targetIndex)
      }
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <>
      <div
        className="pointer-events-none absolute z-20 rounded border-2 border-blue-500"
        style={{
          top: elementRect.top - 2,
          left: elementRect.left - 2,
          width: elementRect.width + 4,
          height: elementRect.height + 4,
        }}
      />

      {dropLineY !== null && (
        <div
          className="pointer-events-none absolute z-40 h-0.5 bg-blue-500"
          style={{
            top: dropLineY,
            left: elementRect.left - 2,
            width: elementRect.width + 4,
          }}
        />
      )}

      <div
        className="pointer-events-auto absolute z-30 flex items-center gap-1"
        style={{
          top: Math.max(0, elementRect.top - 32),
          left: elementRect.left,
        }}
      >
        <button
          type="button"
          title="ドラッグで並べ替え"
          onMouseDown={(e) => e.preventDefault()}
          onPointerDown={handleDragStart}
          className="flex h-6 min-w-6 cursor-grab items-center justify-center rounded bg-blue-600 px-1 text-[11px] text-white shadow-sm active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          {selection.label}
        </span>

        {isTextBlock && (
          <>
            <select
              title="段落スタイル"
              value={['h1', 'h2', 'h3'].includes(selection.tagName) ? selection.tagName : 'p'}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => run('formatBlock', e.target.value)}
              className="h-6 rounded border border-slate-200 bg-white px-1 text-[11px] text-slate-700 shadow-sm"
            >
              <option value="p">段落</option>
              <option value="h1">見出し1</option>
              <option value="h2">見出し2</option>
              <option value="h3">見出し3</option>
            </select>
            <HandleButton title="左揃え" onClick={() => run('justifyLeft')}>
              ⬅
            </HandleButton>
            <HandleButton title="中央揃え" onClick={() => run('justifyCenter')}>
              ☰
            </HandleButton>
            <HandleButton title="右揃え" onClick={() => run('justifyRight')}>
              ➡
            </HandleButton>
          </>
        )}

        <HandleButton title="複製" onClick={handleDuplicate}>
          ⧉
        </HandleButton>
        <HandleButton title="詳細設定" onClick={onOpenDetails}>
          ⚙
        </HandleButton>
        <HandleButton title="削除" onClick={handleRemove} variant="danger">
          ✕
        </HandleButton>
      </div>
    </>
  )
}
