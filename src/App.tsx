import { useCallback, useEffect, useRef, useState } from 'react'
import { DropZone } from './components/DropZone'
import { TopToolbar } from './components/TopToolbar'
import { PartsPanel } from './components/PartsPanel'
import { DeviceFrame } from './components/DeviceFrame'
import { SlideNavigator } from './components/SlideNavigator'
import {
  IframeEditor,
  type IframeEditorHandle,
  type SelectionInfo,
  type HoverInfo,
} from './components/IframeEditor'
import { FloatingToolbar } from './components/FloatingToolbar'
import { ElementOverlay } from './components/ElementOverlay'
import { HoverOverlay } from './components/HoverOverlay'
import { Inspector } from './components/Inspector'
import { Toast } from './components/Toast'
import { downloadHtml, parseDocument, readHtmlFile } from './lib/htmlDocument'
import type { ParsedHtmlDocument } from './types/htmlDocument'
import type { DeviceMode, OverlayRect } from './types/editor'

const HINT_STORAGE_KEY = 'html-editor-hint-dismissed'

function App() {
  const [document, setDocument] = useState<ParsedHtmlDocument | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' } | null>(null)
  const [selection, setSelection] = useState<SelectionInfo | null>(null)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectionRect, setSelectionRect] = useState<OverlayRect | null>(null)
  const [elementRect, setElementRect] = useState<OverlayRect | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [partsOpen, setPartsOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return localStorage.getItem(HINT_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const editorRef = useRef<IframeEditorHandle>(null)
  const overlayLayerRef = useRef<HTMLDivElement>(null)

  const refreshOverlayRects = useCallback(() => {
    setSelectionRect(editorRef.current?.getSelectionRect() ?? null)
    setElementRect(editorRef.current?.getSelectedElementRect() ?? null)
  }, [])

  const openDocument = useCallback((doc: ParsedHtmlDocument) => {
    setDocument(doc)
    setEditorKey((k) => k + 1)
    setError(null)
    setSelection(null)
    setActiveSlide(0)
    setDetailsOpen(false)
    setDeviceMode(doc.format === 'bundler-slide' ? 'slide' : 'desktop')
  }, [])

  const handleFileSelect = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const html = await readHtmlFile(file)
      const doc = await parseDocument(html, file.name)
      openDocument(doc)
      if (doc.format === 'bundler-slide') {
        setToast({ message: `スライド形式を読み込みました（${doc.slideCount ?? 0}枚）`, type: 'info' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました'
      setError(message)
      setToast({ message, type: 'error' })
    } finally {
      setLoading(false)
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
        if (document?.format === 'bundler-slide') {
          setActiveSlide(editorRef.current?.getActiveSlideIndex() ?? 0)
        }
      })
    },
    [document?.format],
  )

  const handleRectsChange = useCallback(() => {
    refreshOverlayRects()
  }, [refreshOverlayRects])

  const dismissHint = () => {
    setHintDismissed(true)
    try {
      localStorage.setItem(HINT_STORAGE_KEY, '1')
    } catch {
      // ignore storage errors
    }
  }

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
          <DropZone onFileSelect={handleFileSelect} error={error} loading={loading} />
        </>
      ) : (
        <>
          <TopToolbar
            editorRef={editorRef}
            fileName={document.fileName}
            format={document.format}
            slideCount={document.slideCount}
            deviceMode={deviceMode}
            partsOpen={partsOpen}
            onTogglePerts={() => setPartsOpen((v) => !v)}
            onDeviceModeChange={setDeviceMode}
            onDownload={handleDownload}
            onOpenNew={handleOpenNew}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />

          {document.format === 'bundler-slide' && (
            <SlideNavigator
              editorRef={editorRef}
              slideCount={document.slideCount ?? editorRef.current?.getSlideCount() ?? 0}
              activeSlide={activeSlide}
              onSlideChange={setActiveSlide}
            />
          )}

          <div className="flex min-h-0 flex-1">
            {partsOpen && (
              <PartsPanel
                editorRef={editorRef}
                format={document.format}
                onClose={() => setPartsOpen(false)}
              />
            )}

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
                    onHoverChange={setHover}
                  />

                  <div ref={overlayLayerRef} className="pointer-events-none absolute inset-0">
                    <HoverOverlay hover={hover} suppressed={isDragging} />
                    <FloatingToolbar
                      editorRef={editorRef}
                      selection={selection}
                      selectionRect={selectionRect}
                    />
                    <ElementOverlay
                      editorRef={editorRef}
                      selection={selection}
                      elementRect={elementRect}
                      layerRef={overlayLayerRef}
                      onOpenDetails={() => setDetailsOpen(true)}
                      onDraggingChange={setIsDragging}
                    />
                  </div>

                  {!hintDismissed && (
                    <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-800/90 px-4 py-2 text-xs text-white shadow-lg">
                      <span>要素をクリックで選択・編集／ハンドル⠿をドラッグで並べ替え</span>
                      <button
                        type="button"
                        onClick={dismissHint}
                        className="rounded-full bg-white/20 px-2 py-0.5 hover:bg-white/30"
                      >
                        閉じる
                      </button>
                    </div>
                  )}
                </div>
              </DeviceFrame>
            </div>

            {detailsOpen && (
              <Inspector
                editorRef={editorRef}
                selection={selection}
                onClose={() => setDetailsOpen(false)}
              />
            )}
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
