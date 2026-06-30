import type { ParsedHtmlDocument } from '../types/htmlDocument'
import { stripEditorChrome, EDITOR_CHROME_STYLES } from './editorChrome'
import {
  isBundlerHtml,
  extractBundlerTemplate,
  unpackBundlerTemplate,
  countSlides,
  repackBundlerHtml,
  mergeBundlerTemplateBody,
} from './bundlerDocument'

const DEFAULT_DOCTYPE = '<!DOCTYPE html>'

export const SLIDE_EDITOR_STYLES = `
<style id="html-editor-slide-mode">
  html, body { height: auto !important; min-height: 100% !important; overflow: auto !important; }
  body { display: block !important; align-items: stretch !important; justify-content: flex-start !important; }
  #deck {
    position: relative !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    counter-reset: slide;
  }
  section.slide, .slide {
    display: flex !important;
    position: relative !important;
    inset: auto !important;
    width: 100% !important;
    min-height: 600px !important;
    margin: 0 0 16px 0 !important;
    box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
    counter-increment: slide;
  }
  section.slide::before, .slide::before {
    content: 'スライド ' counter(slide);
    position: absolute;
    top: 8px;
    right: 12px;
    font: 11px/1.4 system-ui, sans-serif;
    color: #2563eb;
    background: rgba(255,255,255,0.9);
    padding: 2px 8px;
    border-radius: 4px;
    z-index: 5;
    pointer-events: none;
  }
  #nav, #key-hint {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 100 !important;
  }
</style>
`

function parseHtmlString(html: string, fileName: string, format: ParsedHtmlDocument['format']): ParsedHtmlDocument {
  const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i)
  const doctype = doctypeMatch?.[0] ?? DEFAULT_DOCTYPE

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const htmlEl = doc.documentElement
  const htmlAttributes = Array.from(htmlEl.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(' ')

  const headHtml = doc.head?.innerHTML ?? ''
  const bodyEl = doc.body
  const bodyHtml = bodyEl?.innerHTML ?? ''
  const bodyAttributes = bodyEl
    ? Array.from(bodyEl.attributes)
        .map((attr) => `${attr.name}="${attr.value}"`)
        .join(' ')
    : ''

  const slideCount = format === 'bundler-slide' ? countSlides(bodyHtml) : undefined

  return {
    doctype,
    htmlAttributes,
    headHtml,
    bodyHtml,
    bodyAttributes,
    fileName,
    format,
    slideCount,
  }
}

export async function parseDocument(html: string, fileName: string): Promise<ParsedHtmlDocument> {
  if (isBundlerHtml(html)) {
    const { prefix, suffix, templateHtml, manifest } = extractBundlerTemplate(html)
    const unpacked = await unpackBundlerTemplate(templateHtml, manifest)
    const parsed = parseHtmlString(unpacked, fileName, 'bundler-slide')
    parsed.bundlerShell = { prefix, suffix }
    parsed.bundlerTemplateHtml = templateHtml
    return parsed
  }

  return parseHtmlString(html, fileName, 'standard')
}

/** @deprecated Use parseDocument instead */
export function parseHtmlDocument(html: string, fileName: string): ParsedHtmlDocument {
  return parseHtmlString(html, fileName, 'standard')
}

export function buildFullHtml(doc: ParsedHtmlDocument, bodyHtml: string): string {
  const htmlAttrs = doc.htmlAttributes ? ` ${doc.htmlAttributes}` : ''
  const bodyAttrs = doc.bodyAttributes ? ` ${doc.bodyAttributes}` : ''

  return `${doc.doctype}
<html${htmlAttrs}>
<head>
${doc.headHtml}
</head>
<body${bodyAttrs}>
${bodyHtml}
</body>
</html>`
}

/** iframe プレビュー用（body を編集可能にする） */
export function buildEditorHtml(doc: ParsedHtmlDocument, bodyHtml: string): string {
  const htmlAttrs = doc.htmlAttributes ? ` ${doc.htmlAttributes}` : ''
  const baseBodyAttrs = doc.bodyAttributes ? `${doc.bodyAttributes} ` : ''
  const bodyAttrs = `${baseBodyAttrs}contenteditable="true" style="outline:none;min-height:100%;cursor:text"`

  const extraStyles =
    doc.format === 'bundler-slide' ? `${SLIDE_EDITOR_STYLES}` : ''

  return `${doc.doctype}
<html${htmlAttrs}>
<head>
${doc.headHtml}
${EDITOR_CHROME_STYLES}
${extraStyles}
</head>
<body ${bodyAttrs}>
${bodyHtml}
</body>
</html>`
}

export function downloadHtml(doc: ParsedHtmlDocument, bodyHtml: string): void {
  const cleanBody = stripEditorChrome(bodyHtml)

  let outputHtml: string
  if (doc.format === 'bundler-slide' && doc.bundlerShell && doc.bundlerTemplateHtml) {
    const updatedTemplate = mergeBundlerTemplateBody(doc.bundlerTemplateHtml, cleanBody)
    outputHtml = repackBundlerHtml(doc.bundlerShell, updatedTemplate)
  } else {
    outputHtml = buildFullHtml(doc, cleanBody)
  }

  const blob = new Blob([outputHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = doc.fileName || 'edited.html'
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function readHtmlFile(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
    throw new Error('HTMLファイル（.html / .htm）のみ対応しています')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
