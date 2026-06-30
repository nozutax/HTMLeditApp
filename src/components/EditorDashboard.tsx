import { useRef } from 'react'
import { fileToBase64DataUrl } from '../lib/image'
import type { IframeEditorHandle } from './IframeEditor'
import type { ParsedHtmlDocument } from '../types/htmlDocument'

interface EditorDashboardProps {
  document: ParsedHtmlDocument
  editorRef: React.RefObject<IframeEditorHandle | null>
  onDownload: () => void
  onOpenNew: () => void
  onError: (message: string) => void
}

function DashButton({
  onClick,
  title,
  children,
  className = '',
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 ${className}`}
    >
      {children}
    </button>
  )
}

function DashSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 px-4 py-4 last:border-b-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

export function EditorDashboard({
  document,
  editorRef,
  onDownload,
  onOpenNew,
  onError,
}: EditorDashboardProps) {
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
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-800">編集ダッシュボード</h2>
        <p className="mt-1 truncate text-xs text-slate-500" title={document.fileName}>
          {document.fileName}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <DashSection title="ファイル">
          <DashButton title="別のファイルを開く" onClick={onOpenNew} className="w-full">
            ファイルを開く
          </DashButton>
          <DashButton
            title="HTMLをダウンロード"
            onClick={onDownload}
            className="w-full border-blue-200 bg-blue-600 text-white hover:border-blue-400 hover:bg-blue-700"
          >
            ダウンロード
          </DashButton>
        </DashSection>

        <DashSection title="テキスト装飾">
          <DashButton title="太字" onClick={() => run('bold')}>
            <strong>B</strong> 太字
          </DashButton>
          <DashButton title="斜体" onClick={() => run('italic')}>
            <em>I</em> 斜体
          </DashButton>
          <DashButton title="下線" onClick={() => run('underline')}>
            <span className="underline">U</span> 下線
          </DashButton>
        </DashSection>

        <DashSection title="見出し">
          <DashButton title="見出し1" onClick={() => run('formatBlock', 'h1')}>
            H1
          </DashButton>
          <DashButton title="見出し2" onClick={() => run('formatBlock', 'h2')}>
            H2
          </DashButton>
          <DashButton title="見出し3" onClick={() => run('formatBlock', 'h3')}>
            H3
          </DashButton>
        </DashSection>

        <DashSection title="リスト">
          <DashButton title="箇条書き" onClick={() => run('insertUnorderedList')}>
            箇条書き
          </DashButton>
          <DashButton title="番号付きリスト" onClick={() => run('insertOrderedList')}>
            番号付き
          </DashButton>
        </DashSection>

        <DashSection title="挿入">
          <DashButton title="リンクを挿入" onClick={handleLink}>
            リンク
          </DashButton>
          <DashButton title="画像を挿入" onClick={() => imageInputRef.current?.click()}>
            画像
          </DashButton>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </DashSection>

        <DashSection title="履歴">
          <DashButton title="元に戻す" onClick={() => run('undo')}>
            ↩ 元に戻す
          </DashButton>
          <DashButton title="やり直し" onClick={() => run('redo')}>
            ↪ やり直し
          </DashButton>
        </DashSection>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-xs text-slate-400">
          左の画面をクリックして編集し、完了したらダウンロードしてください。
        </p>
      </div>
    </aside>
  )
}
