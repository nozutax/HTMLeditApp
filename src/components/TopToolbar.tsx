import { useRef } from 'react'
import type { DeviceMode } from '../types/editor'
import type { DocumentFormat } from '../types/htmlDocument'
import type { IframeEditorHandle } from './IframeEditor'
import { fileToBase64DataUrl } from '../lib/image'

interface TopToolbarProps {
  editorRef: React.RefObject<IframeEditorHandle | null>
  fileName: string
  format: DocumentFormat
  slideCount?: number
  deviceMode: DeviceMode
  partsOpen: boolean
  onTogglePerts: () => void
  onDeviceModeChange: (mode: DeviceMode) => void
  onDownload: () => void
  onOpenNew: () => void
  onError: (message: string) => void
}

function ToolButton({
  onClick,
  title,
  children,
  active = false,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

function ToolDivider() {
  return <div className="mx-1 h-6 w-px bg-slate-200" />
}

export function TopToolbar({
  editorRef,
  fileName,
  format,
  slideCount,
  deviceMode,
  partsOpen,
  onTogglePerts,
  onDeviceModeChange,
  onDownload,
  onOpenNew,
  onError,
}: TopToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)

  const run = (command: string, value?: string) => {
    editorRef.current?.execCommand(command, value)
  }

  const handleLink = () => {
    const url = window.prompt('リンクURLを入力してください', 'https://')
    if (url) run('createLink', url)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const dataUrl = await fileToBase64DataUrl(file)
      editorRef.current?.insertImage(dataUrl)
    } catch (err) {
      onError(err instanceof Error ? err.message : '画像の挿入に失敗しました')
    }
  }

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-800">HTML編集アプリ</h1>
          <span className="truncate text-xs text-slate-400" title={fileName}>
            {fileName}
          </span>
          {format === 'bundler-slide' && slideCount != null && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              スライド {slideCount}枚
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenNew}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            別のHTMLを開く
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            ダウンロード
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5">
        <button
          type="button"
          title="パーツの表示を切り替え"
          onClick={onTogglePerts}
          className={`flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors ${
            partsOpen
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          ＋ パーツ
        </button>

        <ToolDivider />

        <ToolButton title="元に戻す" onClick={() => run('undo')}>
          ↩
        </ToolButton>
        <ToolButton title="やり直し" onClick={() => run('redo')}>
          ↪
        </ToolButton>

        <ToolDivider />

        <ToolButton title="太字" onClick={() => run('bold')}>
          <strong>B</strong>
        </ToolButton>
        <ToolButton title="斜体" onClick={() => run('italic')}>
          <em>I</em>
        </ToolButton>
        <ToolButton title="下線" onClick={() => run('underline')}>
          <span className="underline">U</span>
        </ToolButton>

        <ToolDivider />

        <select
          title="見出し"
          defaultValue=""
          onChange={(e) => {
            const value = e.target.value
            if (value) run('formatBlock', value)
            e.target.value = ''
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
        >
          <option value="">見出し</option>
          <option value="p">段落</option>
          <option value="h1">見出し1</option>
          <option value="h2">見出し2</option>
          <option value="h3">見出し3</option>
        </select>

        <ToolButton title="箇条書き" onClick={() => run('insertUnorderedList')}>
          •
        </ToolButton>
        <ToolButton title="番号付きリスト" onClick={() => run('insertOrderedList')}>
          1.
        </ToolButton>

        <ToolDivider />

        <label
          title="文字色"
          className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-slate-600 hover:bg-slate-100"
          onMouseDown={(e) => e.preventDefault()}
        >
          A
          <input
            type="color"
            defaultValue="#1e293b"
            onChange={(e) => editorRef.current?.setForeColor(e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>
        <label
          title="マーカー色"
          className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-slate-600 hover:bg-slate-100"
          onMouseDown={(e) => e.preventDefault()}
        >
          🖍
          <input
            type="color"
            defaultValue="#fef08a"
            onChange={(e) => editorRef.current?.setTextBackgroundColor(e.target.value)}
            className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>

        <ToolDivider />

        <ToolButton title="リンクを挿入" onClick={handleLink}>
          🔗
        </ToolButton>
        <ToolButton title="画像を挿入" onClick={() => imageInputRef.current?.click()}>
          🖼
        </ToolButton>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        <ToolDivider />

        <ToolButton
          title="PC表示"
          active={deviceMode === 'desktop'}
          onClick={() => onDeviceModeChange('desktop')}
        >
          🖥
        </ToolButton>
        <ToolButton
          title="タブレット表示"
          active={deviceMode === 'tablet'}
          onClick={() => onDeviceModeChange('tablet')}
        >
          📱
        </ToolButton>
        <ToolButton
          title="スマホ表示"
          active={deviceMode === 'mobile'}
          onClick={() => onDeviceModeChange('mobile')}
        >
          📲
        </ToolButton>
        {format === 'bundler-slide' && (
          <ToolButton
            title="スライド表示 (1200px)"
            active={deviceMode === 'slide'}
            onClick={() => onDeviceModeChange('slide')}
          >
            ▣
          </ToolButton>
        )}
      </div>
    </header>
  )
}
