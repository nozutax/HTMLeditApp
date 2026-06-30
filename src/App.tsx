import { useCallback, useRef, useState } from 'react'
import { DropZone } from './components/DropZone'
import { EditorDashboard } from './components/EditorDashboard'
import { IframeEditor, type IframeEditorHandle, type SelectionInfo } from './components/IframeEditor'
import { Toast } from './components/Toast'
import { downloadHtml, parseHtmlDocument, readHtmlFile } from './lib/htmlDocument'
import type { ParsedHtmlDocument } from './types/htmlDocument'

function App() {
  const [document, setDocument] = useState<ParsedHtmlDocument | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)

  const editorRef = useRef<IframeEditorHandle>(null)

  const openDocument = useCallback((doc: ParsedHtmlDocument) => {
    setDocument(doc)
    setEditorKey((k) => k + 1)
    setError(null)
    setSelection(null)
  }, [])

  const handleFileSelect = async (file: File) => {
    try {
      const html = await readHtmlFile(file)
      openDocument(parseHtmlDocument(html, file.name))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました'
      setError(message)
      setToast({ message, type: 'error' })
    }
  }

  const handleDownload = () => {
    if (!document || !editorRef.current) return
    downloadHtml(document, editorRef.current.getBodyHtml())
    setToast({ message: 'HTMLファイルをダウンロードしました', type: 'info' })
  }

  const handleOpenNew = () => {
    const input = window.document.createElement('input')
    input.type = 'file'
    input.accept = '.html,.htm'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) handleFileSelect(file)
    }
    input.click()
  }

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-800">HTML編集アプリ</h1>
        <p className="mt-0.5 text-xs text-slate-500">HTMLをアップロード → 編集 → ダウンロード</p>
      </header>

      {!document ? (
        <DropZone onFileSelect={handleFileSelect} error={error} />
      ) : (
        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2">
              <span className="text-xs font-medium text-slate-500">プレビュー</span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <div className="h-full overflow-hidden rounded-lg border-2 border-slate-200 bg-white shadow-sm ring-2 ring-transparent focus-within:ring-blue-200">
                <IframeEditor
                  key={editorKey}
                  loadKey={editorKey}
                  ref={editorRef}
                  htmlDocument={document}
                  initialBodyHtml={document.bodyHtml}
                  onSelectionChange={setSelection}
                />
              </div>
            </div>
          </main>

          <EditorDashboard
            document={document}
            editorRef={editorRef}
            selection={selection}
            onDownload={handleDownload}
            onOpenNew={handleOpenNew}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
