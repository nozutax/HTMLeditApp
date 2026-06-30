import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { buildEditorHtml } from '../lib/htmlDocument'
import type { ParsedHtmlDocument } from '../types/htmlDocument'

export interface IframeEditorHandle {
  getBodyHtml: () => string
  insertImage: (dataUrl: string) => void
  execCommand: (command: string, value?: string) => void
}

interface IframeEditorProps {
  loadKey: number
  htmlDocument: ParsedHtmlDocument
  initialBodyHtml: string
}

export const IframeEditor = forwardRef<IframeEditorHandle, IframeEditorProps>(
  function IframeEditor({ loadKey, htmlDocument, initialBodyHtml }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const loadedKeyRef = useRef<number | null>(null)

    const getBodyHtml = useCallback(() => {
      return iframeRef.current?.contentDocument?.body?.innerHTML ?? ''
    }, [])

    const execCommand = useCallback((command: string, value?: string) => {
      const doc = iframeRef.current?.contentDocument
      if (!doc?.body) return
      doc.body.focus()
      doc.execCommand(command, false, value)
    }, [])

    const insertImage = useCallback((dataUrl: string) => {
      const doc = iframeRef.current?.contentDocument
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
    }, [])

    useImperativeHandle(ref, () => ({ getBodyHtml, insertImage, execCommand }), [
      getBodyHtml,
      insertImage,
      execCommand,
    ])

    useEffect(() => {
      if (loadedKeyRef.current === loadKey) return

      const iframe = iframeRef.current
      if (!iframe) return

      loadedKeyRef.current = loadKey
      iframe.srcdoc = buildEditorHtml(htmlDocument, initialBodyHtml)
    }, [loadKey, htmlDocument, initialBodyHtml])

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
