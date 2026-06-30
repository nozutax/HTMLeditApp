import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { buildEditorHtml } from '../lib/htmlDocument'
import {
  describeSelection,
  getSelectedElement,
  updateSelectionHighlight,
  type SelectionInfo,
} from '../lib/editorChrome'
import type { ParsedHtmlDocument } from '../types/htmlDocument'

export type { SelectionInfo }

export interface IframeEditorHandle {
  getBodyHtml: () => string
  insertImage: (dataUrl: string) => void
  execCommand: (command: string, value?: string) => void
  setForeColor: (color: string) => void
  setTextBackgroundColor: (color: string) => void
  setElementBackgroundColor: (color: string) => void
  getSelectionInfo: () => SelectionInfo | null
}

interface IframeEditorProps {
  loadKey: number
  htmlDocument: ParsedHtmlDocument
  initialBodyHtml: string
  onSelectionChange?: (info: SelectionInfo | null) => void
}

function withStyleCommand(doc: Document, command: string, value: string) {
  doc.execCommand('styleWithCSS', false, 'true')
  doc.execCommand(command, false, value)
}

export const IframeEditor = forwardRef<IframeEditorHandle, IframeEditorProps>(
  function IframeEditor({ loadKey, htmlDocument, initialBodyHtml, onSelectionChange }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const loadedKeyRef = useRef<number | null>(null)
    const onSelectionChangeRef = useRef(onSelectionChange)
    onSelectionChangeRef.current = onSelectionChange

    const getIframeDoc = () => iframeRef.current?.contentDocument ?? null

    const notifySelection = useCallback((doc: Document) => {
      updateSelectionHighlight(doc)
      onSelectionChangeRef.current?.(describeSelection(doc))
    }, [])

    const getBodyHtml = useCallback(() => {
      return iframeRef.current?.contentDocument?.body?.innerHTML ?? ''
    }, [])

    const execCommand = useCallback((command: string, value?: string) => {
      const doc = getIframeDoc()
      if (!doc?.body) return
      doc.body.focus()
      doc.execCommand(command, false, value)
      notifySelection(doc)
    }, [notifySelection])

    const setForeColor = useCallback(
      (color: string) => {
        const doc = getIframeDoc()
        if (!doc?.body) return
        doc.body.focus()
        const el = getSelectedElement(doc)
        const sel = doc.getSelection()
        if (sel && !sel.isCollapsed && sel.toString()) {
          withStyleCommand(doc, 'foreColor', color)
        } else if (el && ['button', 'a'].includes(el.tagName.toLowerCase())) {
          el.style.color = color
        } else {
          withStyleCommand(doc, 'foreColor', color)
        }
        notifySelection(doc)
      },
      [notifySelection],
    )

    const setTextBackgroundColor = useCallback(
      (color: string) => {
        const doc = getIframeDoc()
        if (!doc?.body) return
        doc.body.focus()
        doc.execCommand('styleWithCSS', false, 'true')
        if (!doc.execCommand('hiliteColor', false, color)) {
          doc.execCommand('backColor', false, color)
        }
        notifySelection(doc)
      },
      [notifySelection],
    )

    const setElementBackgroundColor = useCallback(
      (color: string) => {
        const doc = getIframeDoc()
        if (!doc?.body) return
        doc.body.focus()
        const el = getSelectedElement(doc)
        if (el) {
          el.style.backgroundColor = color
        }
        notifySelection(doc)
      },
      [notifySelection],
    )

    const getSelectionInfo = useCallback(() => {
      const doc = getIframeDoc()
      return doc ? describeSelection(doc) : null
    }, [])

    const insertImage = useCallback(
      (dataUrl: string) => {
        const doc = getIframeDoc()
        if (!doc?.body) return

        doc.body.focus()
        const img = doc.createElement('img')
        img.src = dataUrl
        img.alt = ''
        img.style.maxWidth = '100%'

        const selection = doc.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(img)
          range.setStartAfter(img)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          doc.body.appendChild(img)
        }
        notifySelection(doc)
      },
      [notifySelection],
    )

    useImperativeHandle(
      ref,
      () => ({
        getBodyHtml,
        insertImage,
        execCommand,
        setForeColor,
        setTextBackgroundColor,
        setElementBackgroundColor,
        getSelectionInfo,
      }),
      [
        getBodyHtml,
        insertImage,
        execCommand,
        setForeColor,
        setTextBackgroundColor,
        setElementBackgroundColor,
        getSelectionInfo,
      ],
    )

    useEffect(() => {
      if (loadedKeyRef.current === loadKey) return

      const iframe = iframeRef.current
      if (!iframe) return

      loadedKeyRef.current = loadKey

      const onLoad = () => {
        const doc = iframe.contentDocument
        if (!doc?.body) return

        const handleSelectionChange = () => notifySelection(doc)
        doc.addEventListener('selectionchange', handleSelectionChange)
        doc.addEventListener('mouseup', handleSelectionChange)
        doc.addEventListener('keyup', handleSelectionChange)
        notifySelection(doc)

        iframe.dataset.selectionCleanup = 'true'
        ;(iframe as HTMLIFrameElement & { _cleanup?: () => void })._cleanup = () => {
          doc.removeEventListener('selectionchange', handleSelectionChange)
          doc.removeEventListener('mouseup', handleSelectionChange)
          doc.removeEventListener('keyup', handleSelectionChange)
        }
      }

      iframe.addEventListener('load', onLoad, { once: true })
      iframe.srcdoc = buildEditorHtml(htmlDocument, initialBodyHtml)

      return () => {
        iframe.removeEventListener('load', onLoad)
        const cleanup = (iframe as HTMLIFrameElement & { _cleanup?: () => void })._cleanup
        cleanup?.()
      }
    }, [loadKey, htmlDocument, initialBodyHtml, notifySelection])

    return (
      <iframe
        ref={iframeRef}
        title="HTMLプレビュー"
        className="h-full w-full border-0 bg-white"
        sandbox="allow-same-origin"
      />
    )
  },
)
