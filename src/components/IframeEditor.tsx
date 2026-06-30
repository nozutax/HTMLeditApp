import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { buildFullHtml } from '../lib/htmlDocument'
import type { ParsedHtmlDocument } from '../types/htmlDocument'

export interface IframeEditorHandle {
  getBodyHtml: () => string
  insertImage: (dataUrl: string) => void
  execCommand: (command: string, value?: string) => void
  getIframeElement: () => HTMLIFrameElement | null
}

interface IframeEditorProps {
  document: ParsedHtmlDocument
  initialBodyHtml: string
  onBodyChange: (html: string) => void
}

export const IframeEditor = forwardRef<IframeEditorHandle, IframeEditorProps>(
  function IframeEditor({ document, initialBodyHtml, onBodyChange }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const onBodyChangeRef = useRef(onBodyChange)
    onBodyChangeRef.current = onBodyChange

    const getBodyHtml = useCallback(() => {
      const doc = iframeRef.current?.contentDocument
      return doc?.body?.innerHTML ?? initialBodyHtml
    }, [initialBodyHtml])

    const execCommand = useCallback((command: string, value?: string) => {
      const doc = iframeRef.current?.contentDocument
      if (!doc?.body) return
      doc.body.focus()
      doc.execCommand(command, false, value)
      onBodyChangeRef.current(doc.body.innerHTML)
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

      onBodyChangeRef.current(doc.body.innerHTML)
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        getBodyHtml,
        insertImage,
        execCommand,
        getIframeElement: () => iframeRef.current,
      }),
      [getBodyHtml, insertImage, execCommand],
    )

    useEffect(() => {
      const iframe = iframeRef.current
      if (!iframe) return

      const fullHtml = buildFullHtml(document, initialBodyHtml)

      const onLoad = () => {
        const doc = iframe.contentDocument
        if (!doc?.body) return

        doc.body.contentEditable = 'true'
        doc.body.style.minHeight = '100%'
        doc.body.style.outline = 'none'
        doc.body.style.cursor = 'text'

        const handleInput = () => {
          onBodyChangeRef.current(doc.body.innerHTML)
        }
        doc.body.addEventListener('input', handleInput)
      }

      iframe.addEventListener('load', onLoad)
      iframe.srcdoc = fullHtml

      return () => {
        iframe.removeEventListener('load', onLoad)
      }
    }, [document, initialBodyHtml])

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
