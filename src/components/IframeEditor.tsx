import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { buildEditorHtml, SLIDE_NATIVE_WIDTH } from '../lib/htmlDocument'
import {
  describeSelection,
  describeElementForInspector,
  getSelectedElement,
  updateSelectionHighlight,
  getSelectionRectInDoc,
  getSelectedElementRectInDoc,
  moveSelectedElement,
  duplicateSelectedElement,
  removeSelectedElement,
  insertHtmlAtSelection,
  goToSlide as goToSlideInDoc,
  getSlideElements,
  getElementLabel,
  getSelectableElementAtPoint,
  getMovableSiblingRectsInDoc,
  moveSelectedToIndex as moveSelectedToIndexInDoc,
  type SelectionInfo,
  type ElementInspectorInfo,
} from '../lib/editorChrome'
import type { OverlayRect } from '../types/editor'
import type { ParsedHtmlDocument } from '../types/htmlDocument'

export type { SelectionInfo, ElementInspectorInfo }

export interface HoverInfo {
  label: string
  rect: OverlayRect
}

export interface SiblingRects {
  rects: OverlayRect[]
  currentIndex: number
}

export interface IframeEditorHandle {
  getBodyHtml: () => string
  insertImage: (dataUrl: string) => void
  insertHtml: (html: string) => void
  execCommand: (command: string, value?: string) => void
  setForeColor: (color: string) => void
  setTextBackgroundColor: (color: string) => void
  setElementBackgroundColor: (color: string) => void
  setElementStyle: (property: string, value: string) => void
  setElementAttribute: (attr: string, value: string) => void
  getSelectionInfo: () => SelectionInfo | null
  getInspectorInfo: () => ElementInspectorInfo | null
  getSelectionRect: () => OverlayRect | null
  getSelectedElementRect: () => OverlayRect | null
  moveSelected: (direction: 'up' | 'down') => void
  duplicateSelected: () => void
  removeSelected: () => void
  getIframeElement: () => HTMLIFrameElement | null
  getSlideCount: () => number
  goToSlide: (index: number) => void
  getActiveSlideIndex: () => number
  getSiblingRects: () => SiblingRects | null
  moveSelectedToIndex: (index: number) => void
}

interface IframeEditorProps {
  loadKey: number
  htmlDocument: ParsedHtmlDocument
  initialBodyHtml: string
  onSelectionChange?: (info: SelectionInfo | null) => void
  onRectsChange?: () => void
  onHoverChange?: (info: HoverInfo | null) => void
}

function withStyleCommand(doc: Document, command: string, value: string) {
  doc.execCommand('styleWithCSS', false, 'true')
  doc.execCommand(command, false, value)
}

function docRectToOverlayRect(
  iframe: HTMLIFrameElement,
  rect: DOMRect | null,
): OverlayRect | null {
  if (!rect) return null
  const iframeRect = iframe.getBoundingClientRect()
  return {
    top: rect.top - iframeRect.top,
    left: rect.left - iframeRect.left,
    width: rect.width,
    height: rect.height,
  }
}

export const IframeEditor = forwardRef<IframeEditorHandle, IframeEditorProps>(
  function IframeEditor(
    { loadKey, htmlDocument, initialBodyHtml, onSelectionChange, onRectsChange, onHoverChange },
    ref,
  ) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const loadedKeyRef = useRef<number | null>(null)
    const onSelectionChangeRef = useRef(onSelectionChange)
    const onRectsChangeRef = useRef(onRectsChange)
    const onHoverChangeRef = useRef(onHoverChange)
    onSelectionChangeRef.current = onSelectionChange
    onRectsChangeRef.current = onRectsChange
    onHoverChangeRef.current = onHoverChange

    const getIframeDoc = () => iframeRef.current?.contentDocument ?? null

    const notifySelection = useCallback((doc: Document) => {
      updateSelectionHighlight(doc)
      onSelectionChangeRef.current?.(describeSelection(doc))
      onRectsChangeRef.current?.()
    }, [])

    const getBodyHtml = useCallback(() => {
      return iframeRef.current?.contentDocument?.body?.innerHTML ?? ''
    }, [])

    const execCommand = useCallback(
      (command: string, value?: string) => {
        const doc = getIframeDoc()
        if (!doc?.body) return
        doc.body.focus()
        doc.execCommand(command, false, value)
        notifySelection(doc)
      },
      [notifySelection],
    )

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

    const setElementStyle = useCallback(
      (property: string, value: string) => {
        const doc = getIframeDoc()
        if (!doc?.body) return
        const el = getSelectedElement(doc)
        if (el && el !== doc.body) {
          ;(el.style as unknown as Record<string, string>)[property] = value
        }
        notifySelection(doc)
      },
      [notifySelection],
    )

    const setElementAttribute = useCallback(
      (attr: string, value: string) => {
        const doc = getIframeDoc()
        if (!doc?.body) return
        const el = getSelectedElement(doc)
        if (el && el !== doc.body) {
          el.setAttribute(attr, value)
        }
        notifySelection(doc)
      },
      [notifySelection],
    )

    const getSelectionInfo = useCallback(() => {
      const doc = getIframeDoc()
      return doc ? describeSelection(doc) : null
    }, [])

    const getInspectorInfo = useCallback(() => {
      const doc = getIframeDoc()
      return doc ? describeElementForInspector(doc) : null
    }, [])

    const getSelectionRect = useCallback((): OverlayRect | null => {
      const iframe = iframeRef.current
      const doc = getIframeDoc()
      if (!iframe || !doc) return null
      return docRectToOverlayRect(iframe, getSelectionRectInDoc(doc))
    }, [])

    const getSelectedElementRect = useCallback((): OverlayRect | null => {
      const iframe = iframeRef.current
      const doc = getIframeDoc()
      if (!iframe || !doc) return null
      return docRectToOverlayRect(iframe, getSelectedElementRectInDoc(doc))
    }, [])

    const getSiblingRects = useCallback((): SiblingRects | null => {
      const iframe = iframeRef.current
      const doc = getIframeDoc()
      if (!iframe || !doc) return null
      const result = getMovableSiblingRectsInDoc(doc)
      if (!result) return null
      const rects = result.rects
        .map((rect) => docRectToOverlayRect(iframe, rect))
        .filter((rect): rect is OverlayRect => rect !== null)
      if (rects.length !== result.rects.length) return null
      return { rects, currentIndex: result.currentIndex }
    }, [])

    const moveSelectedToIndex = useCallback(
      (index: number) => {
        const doc = getIframeDoc()
        if (!doc) return
        moveSelectedToIndexInDoc(doc, index)
        notifySelection(doc)
      },
      [notifySelection],
    )

    const moveSelected = useCallback(
      (direction: 'up' | 'down') => {
        const doc = getIframeDoc()
        if (!doc) return
        moveSelectedElement(doc, direction)
        notifySelection(doc)
      },
      [notifySelection],
    )

    const duplicateSelected = useCallback(() => {
      const doc = getIframeDoc()
      if (!doc) return
      duplicateSelectedElement(doc)
      notifySelection(doc)
    }, [notifySelection])

    const removeSelected = useCallback(() => {
      const doc = getIframeDoc()
      if (!doc) return
      removeSelectedElement(doc)
      notifySelection(doc)
    }, [notifySelection])

    const getSlideCount = useCallback(() => {
      const doc = getIframeDoc()
      return doc ? getSlideElements(doc).length : 0
    }, [])

    const goToSlide = useCallback(
      (index: number) => {
        const doc = getIframeDoc()
        if (!doc) return
        goToSlideInDoc(doc, index)
        notifySelection(doc)
      },
      [notifySelection],
    )

    const getActiveSlideIndex = useCallback(() => {
      const doc = getIframeDoc()
      if (!doc) return 0
      const el = getSelectedElement(doc)
      if (!el) return 0
      const slides = getSlideElements(doc)
      const idx = slides.findIndex((slide) => slide === el || slide.contains(el))
      return idx >= 0 ? idx : 0
    }, [])

    const insertHtml = useCallback(
      (html: string) => {
        const doc = getIframeDoc()
        if (!doc) return
        insertHtmlAtSelection(doc, html)
        notifySelection(doc)
      },
      [notifySelection],
    )

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
        insertHtml,
        execCommand,
        setForeColor,
        setTextBackgroundColor,
        setElementBackgroundColor,
        setElementStyle,
        setElementAttribute,
        getSelectionInfo,
        getInspectorInfo,
        getSelectionRect,
        getSelectedElementRect,
        moveSelected,
        duplicateSelected,
        removeSelected,
        getIframeElement: () => iframeRef.current,
        getSlideCount,
        goToSlide,
        getActiveSlideIndex,
        getSiblingRects,
        moveSelectedToIndex,
      }),
      [
        getBodyHtml,
        insertImage,
        insertHtml,
        execCommand,
        setForeColor,
        setTextBackgroundColor,
        setElementBackgroundColor,
        setElementStyle,
        setElementAttribute,
        getSelectionInfo,
        getInspectorInfo,
        getSelectionRect,
        getSelectedElementRect,
        moveSelected,
        duplicateSelected,
        removeSelected,
        getSlideCount,
        goToSlide,
        getActiveSlideIndex,
        getSiblingRects,
        moveSelectedToIndex,
      ],
    )

    useEffect(() => {
      if (loadedKeyRef.current === loadKey) return

      const iframe = iframeRef.current
      if (!iframe) return

      loadedKeyRef.current = loadKey

      const isSlide = htmlDocument.format === 'bundler-slide'

      const updateSlideZoom = () => {
        if (!isSlide) return
        const frame = iframeRef.current
        const d = frame?.contentDocument
        if (!frame || !d?.documentElement) return
        const available = frame.clientWidth - 32
        const scale = Math.min(1, Math.max(0.1, available / SLIDE_NATIVE_WIDTH))
        d.documentElement.style.setProperty('--ed-slide-zoom', String(scale))
      }

      const onLoad = () => {
        const doc = iframe.contentDocument
        if (!doc?.body) return

        updateSlideZoom()

        const handleSelectionChange = () => notifySelection(doc)
        const handleScroll = () => onRectsChangeRef.current?.()

        const resizeObserver = new ResizeObserver(() => {
          updateSlideZoom()
          onRectsChangeRef.current?.()
        })
        resizeObserver.observe(iframe)

        let hoverFrame = 0
        const handleMouseMove = (e: MouseEvent) => {
          if (hoverFrame) return
          hoverFrame = requestAnimationFrame(() => {
            hoverFrame = 0
            const cb = onHoverChangeRef.current
            if (!cb) return
            const el = getSelectableElementAtPoint(doc, e.clientX, e.clientY)
            const frame = iframeRef.current
            if (!el || !frame) {
              cb(null)
              return
            }
            const rect = docRectToOverlayRect(frame, el.getBoundingClientRect())
            if (!rect) {
              cb(null)
              return
            }
            cb({ label: getElementLabel(el), rect })
          })
        }
        const handleMouseLeave = () => {
          if (hoverFrame) {
            cancelAnimationFrame(hoverFrame)
            hoverFrame = 0
          }
          onHoverChangeRef.current?.(null)
        }

        doc.addEventListener('selectionchange', handleSelectionChange)
        doc.addEventListener('mouseup', handleSelectionChange)
        doc.addEventListener('keyup', handleSelectionChange)
        doc.addEventListener('scroll', handleScroll, true)
        doc.addEventListener('mousemove', handleMouseMove)
        doc.addEventListener('mouseleave', handleMouseLeave)
        window.addEventListener('resize', handleScroll)
        notifySelection(doc)

        iframe.dataset.selectionCleanup = 'true'
        ;(iframe as HTMLIFrameElement & { _cleanup?: () => void })._cleanup = () => {
          if (hoverFrame) cancelAnimationFrame(hoverFrame)
          resizeObserver.disconnect()
          doc.removeEventListener('selectionchange', handleSelectionChange)
          doc.removeEventListener('mouseup', handleSelectionChange)
          doc.removeEventListener('keyup', handleSelectionChange)
          doc.removeEventListener('scroll', handleScroll, true)
          doc.removeEventListener('mousemove', handleMouseMove)
          doc.removeEventListener('mouseleave', handleMouseLeave)
          window.removeEventListener('resize', handleScroll)
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
