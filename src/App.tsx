import { useCallback, useRef, useState } from 'react'
import { DropZone } from './components/DropZone'
import { EditorDashboard } from './components/EditorDashboard'
import { IframeEditor, type IframeEditorHandle } from './components/IframeEditor'
import { Toast } from './components/Toast'
import { downloadHtml, parseHtmlDocument, readHtmlFile } from './lib/htmlDocument'
import type { ParsedHtmlDocument } from './types/htmlDocument'

function App() {
  const [document, setDocument] = useState<ParsedHtmlDocument | null>(null)
  const [bodyHtml, setBodyHtml] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null)

  const editorRef = useRef<IframeEditorHandle>(null)

  const openDocument = useCallback((doc: ParsedHtmlDocument) => {
    setDocument(doc)
    setBodyHtml(doc.bodyHtml)
    setEditorKey((k) => k + 1)
    setError(null)
  }, [])

  const handleFileSelect = async (file: File) => {
    try {
      const html = await readHtmlFile(file)
      const parsed = parseHtmlDocument(html, file.name)
      openDocument(parsed)
      setToast({ message: `「${file.name}」を読み込みました`, type: 'info' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました'
      setError(message)
      setToast({ message, type: 'error' })
    }
  }

  const handleBodyChange = useCallback((html: string) => {
    setBodyHtml(html)
  }, [])

  const handleDownload = () => {
    if (!document) return
    const currentBody = editorRef.current?.getBodyHtml() ?? bodyHtml
    downloadHtml(document, currentBody)
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
              <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <IframeEditor
                  key={editorKey}
                  ref={editorRef}
                  document={document}
                  initialBodyHtml={bodyHtml}
                  onBodyChange={handleBodyChange}
                />
              </div>
            </div>
          </main>

          <EditorDashboard
            document={document}
            editorRef={editorRef}
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
