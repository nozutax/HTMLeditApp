import type { IframeEditorHandle, SelectionInfo } from './IframeEditor'
import type { OverlayRect } from '../types/editor'

interface FloatingToolbarProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
  selection: SelectionInfo | null
  selectionRect: OverlayRect | null
}

function BubbleButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 min-w-7 items-center justify-center rounded text-xs text-white hover:bg-white/20"
    >
      {children}
    </button>
  )
}

export function FloatingToolbar({ editorRef, selection, selectionRect }: FloatingToolbarProps) {
  if (!selection || selection.isCollapsed || !selectionRect) return null

  const run = (command: string, value?: string) => {
    editorRef.current?.execCommand(command, value)
  }

  const handleLink = () => {
    const url = window.prompt('リンクURLを入力してください', 'https://')
    if (url) run('createLink', url)
  }

  const top = Math.max(0, selectionRect.top - 44)
  const left = selectionRect.left + selectionRect.width / 2

  return (
    <div
      className="pointer-events-auto absolute z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-lg bg-slate-800 px-1 py-0.5 shadow-lg"
      style={{ top, left }}
    >
      <BubbleButton title="太字" onClick={() => run('bold')}>
        <strong>B</strong>
      </BubbleButton>
      <BubbleButton title="斜体" onClick={() => run('italic')}>
        <em>I</em>
      </BubbleButton>
      <BubbleButton title="下線" onClick={() => run('underline')}>
        <span className="underline">U</span>
      </BubbleButton>
      <div className="mx-0.5 h-4 w-px bg-white/30" />
      <label
        title="文字色"
        className="flex h-7 cursor-pointer items-center px-1"
        onMouseDown={(e) => e.preventDefault()}
      >
        <input
          type="color"
          defaultValue="#ffffff"
          onChange={(e) => editorRef.current?.setForeColor(e.target.value)}
          className="h-4 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
      <label
        title="マーカー色"
        className="flex h-7 cursor-pointer items-center px-1"
        onMouseDown={(e) => e.preventDefault()}
      >
        <input
          type="color"
          defaultValue="#fef08a"
          onChange={(e) => editorRef.current?.setTextBackgroundColor(e.target.value)}
          className="h-4 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
      <div className="mx-0.5 h-4 w-px bg-white/30" />
      <BubbleButton title="リンク" onClick={handleLink}>
        🔗
      </BubbleButton>
    </div>
  )
}
