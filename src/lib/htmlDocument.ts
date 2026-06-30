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

/** スライド1枚の本来の設計サイズ（全画面プレゼン用）。 */
export const SLIDE_NATIVE_WIDTH = 1200
export const SLIDE_NATIVE_HEIGHT = 800

export const SLIDE_EDITOR_STYLES = `
<style id="html-editor-slide-mode">
  html, body {
    height: auto !important;
    min-height: 100% !important;
    width: auto !important;
    overflow: auto !important;
    margin: 0 !important;
    background: #e2e8f0 !important;
    display: block !important;
  }
  /* 表示領域の幅に合わせてデッキ全体を自動縮小し、全体を見えるようにする */
  #deck {
    position: relative !important;
    width: ${SLIDE_NATIVE_WIDTH}px !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 auto !important;
    padding: 24px 0 !important;
    zoom: var(--ed-slide-zoom, 1);
    counter-reset: slide;
  }
  /* 各スライドを本来の比率（1200x800）で描画 */
  section.slide, .slide {
    display: block !important;
    position: relative !important;
    inset: auto !important;
    width: ${SLIDE_NATIVE_WIDTH}px !important;
    height: ${SLIDE_NATIVE_HEIGHT}px !important;
    min-height: 0 !important;
    margin: 0 auto 24px !important;
    overflow: hidden !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.18), inset 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
    counter-increment: slide;
  }
  section.slide::before, .slide::before {
    content: 'スライド ' counter(slide);
    position: absolute;
    top: 10px;
    right: 12px;
    font: 12px/1.4 system-ui, sans-serif;
    color: #2563eb;
    background: rgba(255,255,255,0.92);
    padding: 2px 8px;
    border-radius: 4px;
    z-index: 5;
    pointer-events: none;
  }
  /* 元のスライドショー用ナビは編集中は隠す */
  #nav, #key-hint { display: none !important; }
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
