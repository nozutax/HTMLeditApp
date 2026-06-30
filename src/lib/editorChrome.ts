export const EDITOR_CHROME_STYLES = `
<style id="html-editor-chrome">
  ::selection {
    background: #2563eb !important;
    color: #ffffff !important;
  }
  [data-editor-selected] {
    outline: 3px solid #2563eb !important;
    outline-offset: 3px !important;
    box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.2) !important;
  }
</style>
`

const TAG_LABELS: Record<string, string> = {
  button: 'ボタン',
  a: 'リンク',
  p: '段落',
  h1: '見出し1',
  h2: '見出し2',
  h3: '見出し3',
  h4: '見出し4',
  h5: '見出し5',
  h6: '見出し6',
  li: 'リスト項目',
  ul: '箇条書き',
  ol: '番号付きリスト',
  img: '画像',
  table: 'テーブル',
  td: 'セル',
  th: '見出しセル',
  div: 'ブロック',
  section: 'セクション',
  span: 'テキスト',
  body: 'ページ全体',
}

export interface SelectionInfo {
  label: string
  tagName: string
  preview: string
  isCollapsed: boolean
}

function getElementFromNode(node: Node | null, body: HTMLElement): HTMLElement | null {
  if (!node) return null
  let el: HTMLElement | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
  if (!el || el === body) return body

  const target = el.closest(
    'button, a, input, p, h1, h2, h3, h4, h5, h6, li, ul, ol, table, img, section, div, span',
  ) as HTMLElement | null

  return target && target !== body ? target : el
}

export function describeSelection(doc: Document): SelectionInfo | null {
  const body = doc.body
  if (!body) return null

  const sel = doc.getSelection()
  if (!sel || sel.rangeCount === 0) return null

  const element = getElementFromNode(sel.anchorNode, body)
  if (!element) return null

  const tagName = element.tagName.toLowerCase()
  const label = TAG_LABELS[tagName] ?? tagName

  if (!sel.isCollapsed && sel.toString().trim()) {
    const text = sel.toString().trim()
    const preview = text.length > 24 ? `${text.slice(0, 24)}…` : text
    return { label: '選択テキスト', tagName: 'text', preview, isCollapsed: false }
  }

  const preview =
    element.textContent?.trim().slice(0, 24) ||
    (tagName === 'img' ? '画像' : label)

  return {
    label,
    tagName,
    preview: preview.length > 24 ? `${preview.slice(0, 24)}…` : preview,
    isCollapsed: true,
  }
}

export function updateSelectionHighlight(doc: Document): void {
  doc.querySelectorAll('[data-editor-selected]').forEach((el) => {
    el.removeAttribute('data-editor-selected')
  })

  const body = doc.body
  if (!body) return

  const sel = doc.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const element = getElementFromNode(sel.anchorNode, body)
  if (element) {
    element.setAttribute('data-editor-selected', 'true')
  }
}

export function getSelectedElement(doc: Document): HTMLElement | null {
  const body = doc.body
  if (!body) return null

  const sel = doc.getSelection()
  if (!sel || sel.rangeCount === 0) return null

  return getElementFromNode(sel.anchorNode, body)
}

export function stripEditorChrome(html: string): string {
  return html.replace(/\s*data-editor-selected="[^"]*"/g, '')
}
