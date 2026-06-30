import type { ParsedHtmlDocument } from '../types/htmlDocument'
import { stripEditorChrome } from './editorChrome'
import { EDITOR_CHROME_STYLES } from './editorChrome'

const DEFAULT_DOCTYPE = '<!DOCTYPE html>'

export function parseHtmlDocument(html: string, fileName: string): ParsedHtmlDocument {
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

  return {
    doctype,
    htmlAttributes,
    headHtml,
    bodyHtml,
    bodyAttributes,
    fileName,
  }
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

  return `${doc.doctype}
<html${htmlAttrs}>
<head>
${doc.headHtml}
${EDITOR_CHROME_STYLES}
</head>
<body ${bodyAttrs}>
${bodyHtml}
</body>
</html>`
}

export function downloadHtml(doc: ParsedHtmlDocument, bodyHtml: string): void {
  const cleanBody = stripEditorChrome(bodyHtml)
  const fullHtml = buildFullHtml(doc, cleanBody)
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
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
