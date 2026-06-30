import type { IframeEditorHandle, SelectionInfo } from './IframeEditor'
import type { OverlayRect } from '../types/editor'

interface ElementOverlayProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
  selection: SelectionInfo | null
  elementRect: OverlayRect | null
}

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

export function ElementOverlay({ editorRef, selection, elementRect }: ElementOverlayProps) {
  if (!selection || !selection.isCollapsed || !elementRect || selection.tagName === 'text') {
    return null
  }

  if (selection.tagName === 'body') return null

  const handleMoveUp = () => editorRef.current?.moveSelected('up')
  const handleMoveDown = () => editorRef.current?.moveSelected('down')
  const handleDuplicate = () => editorRef.current?.duplicateSelected()
  const handleRemove = () => {
    if (window.confirm('この要素を削除しますか？')) {
      editorRef.current?.removeSelected()
    }
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

      <div
        className="pointer-events-auto absolute z-30 flex items-center gap-1"
        style={{
          top: Math.max(0, elementRect.top - 32),
          left: elementRect.left,
        }}
      >
        <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          {selection.label}
        </span>
        <HandleButton title="上へ移動" onClick={handleMoveUp}>
          ↑
        </HandleButton>
        <HandleButton title="下へ移動" onClick={handleMoveDown}>
          ↓
        </HandleButton>
        <HandleButton title="複製" onClick={handleDuplicate}>
          ⧉
        </HandleButton>
        <HandleButton title="削除" onClick={handleRemove} variant="danger">
          ✕
        </HandleButton>
      </div>
    </>
  )
}
