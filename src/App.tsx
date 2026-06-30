import { useCallback, useEffect, useRef, useState } from 'react'
import { DropZone } from './components/DropZone'
import { TopToolbar } from './components/TopToolbar'
import { PartsPanel } from './components/PartsPanel'
import { DeviceFrame } from './components/DeviceFrame'
import { IframeEditor, type IframeEditorHandle, type SelectionInfo } from './components/IframeEditor'
import { FloatingToolbar } from './components/FloatingToolbar'
import { ElementOverlay } from './components/ElementOverlay'
import { Inspector } from './components/Inspector'
import { Toast } from './components/Toast'
import { downloadHtml, parseHtmlDocument, readHtmlFile } from './lib/htmlDocument'
import type { ParsedHtmlDocument } from './types/htmlDocument'
import type { DeviceMode, OverlayRect } from './types/editor'

function App() {
  const [document, setDocument] = useState<ParsedHtmlDocument | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [selectionRect, setSelectionRect] = useState<OverlayRect | null>(null)
  const [elementRect, setElementRect] = useState<OverlayRect | null>(null)

  const editorRef = useRef<IframeEditorHandle>(null)

  const refreshOverlayRects = useCallback(() => {
    setSelectionRect(editorRef.current?.getSelectionRect() ?? null)
    setElementRect(editorRef.current?.getSelectedElementRect() ?? null)
  }, [])

  const openDocument = useCallback((doc: ParsedHtmlDocument) => {
    setDocument(doc)
    setEditorKey((k) => k + 1)
    setError(null)
    setSelection(null)
    setDeviceMode('desktop')
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

  const handleSelectionChange = useCallback(
    (info: SelectionInfo | null) => {
      setSelection(info)
      requestAnimationFrame(() => {
        setSelectionRect(editorRef.current?.getSelectionRect() ?? null)
        setElementRect(editorRef.current?.getSelectedElementRect() ?? null)
      })
    },
    [],
  )

  const handleRectsChange = useCallback(() => {
    refreshOverlayRects()
  }, [refreshOverlayRects])

  useEffect(() => {
    refreshOverlayRects()
  }, [deviceMode, refreshOverlayRects])

  return (
    <div className="flex h-full flex-col bg-slate-100">
      {!document ? (
        <>
          <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
            <h1 className="text-lg font-semibold text-slate-800">HTML編集アプリ</h1>
          </header>
          <DropZone onFileSelect={handleFileSelect} error={error} />
        </>
      ) : (
        <>
          <TopToolbar
            editorRef={editorRef}
            fileName={document.fileName}
            deviceMode={deviceMode}
            onDeviceModeChange={setDeviceMode}
            onDownload={handleDownload}
            onOpenNew={handleOpenNew}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />

          <div className="flex min-h-0 flex-1">
            <PartsPanel editorRef={editorRef} />

            <div className="relative flex min-w-0 flex-1 flex-col">
              <DeviceFrame deviceMode={deviceMode}>
                <div className="relative h-full">
                  <IframeEditor
                    key={editorKey}
                    loadKey={editorKey}
                    ref={editorRef}
                    htmlDocument={document}
                    initialBodyHtml={document.bodyHtml}
                    onSelectionChange={handleSelectionChange}
                    onRectsChange={handleRectsChange}
                  />
                  <FloatingToolbar
                    editorRef={editorRef}
                    selection={selection}
                    selectionRect={selectionRect}
                  />
                  <ElementOverlay
                    editorRef={editorRef}
                    selection={selection}
                    elementRect={elementRect}
                  />
                </div>
              </DeviceFrame>
            </div>

            <Inspector editorRef={editorRef} selection={selection} />
          </div>
        </>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}

export default App
