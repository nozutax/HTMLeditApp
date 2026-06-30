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
  [data-editor-block] {
    position: relative;
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
  section: 'スライド',
  span: 'テキスト',
  body: 'ページ全体',
  hr: '区切り線',
}

export interface SelectionInfo {
  label: string
  tagName: string
  preview: string
  isCollapsed: boolean
}

export interface ElementInspectorInfo {
  tagName: string
  label: string
  textColor: string
  backgroundColor: string
  href: string
  alt: string
  padding: string
  margin: string
}

const BLOCK_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table',
  'section', 'div', 'blockquote', 'hr', 'img', 'button', 'a',
])

/** クリック対象として意味のあるブロック/要素（span などインラインは含めない）。 */
const SELECTABLE_SELECTOR =
  'button, a, input, p, h1, h2, h3, h4, h5, h6, li, ul, ol, table, img, section, div, hr, blockquote'

function getElementFromNode(node: Node | null, body: HTMLElement): HTMLElement | null {
  if (!node) return null
  const el: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)
  if (!el || el === body) return body

  const target = el.closest(SELECTABLE_SELECTOR) as HTMLElement | null

  return target && target !== body ? target : el
}

export function getElementLabel(el: HTMLElement): string {
  const tagName = el.tagName.toLowerCase()
  return TAG_LABELS[tagName] ?? tagName
}

export function getSelectableElementAtPoint(
  doc: Document,
  x: number,
  y: number,
): HTMLElement | null {
  const body = doc.body
  if (!body) return null
  const node = doc.elementFromPoint(x, y)
  if (!node) return null
  const el = getElementFromNode(node, body)
  return el && el !== body ? el : null
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

export function describeElementForInspector(doc: Document): ElementInspectorInfo | null {
  const el = getSelectedElement(doc)
  if (!el || el === doc.body) return null

  const tagName = el.tagName.toLowerCase()
  const computed = doc.defaultView?.getComputedStyle(el)

  return {
    tagName,
    label: TAG_LABELS[tagName] ?? tagName,
    textColor: rgbToHex(computed?.color ?? '#000000'),
    backgroundColor: rgbToHex(computed?.backgroundColor ?? 'transparent'),
    href: el.tagName.toLowerCase() === 'a' ? (el as HTMLAnchorElement).href : '',
    alt: el.tagName.toLowerCase() === 'img' ? (el as HTMLImageElement).alt : '',
    padding: el.style.padding || '',
    margin: el.style.margin || '',
  }
}

function rgbToHex(rgb: string): string {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff'
  if (rgb.startsWith('#')) return rgb.slice(0, 7)

  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return '#000000'

  const r = Number(match[1]).toString(16).padStart(2, '0')
  const g = Number(match[2]).toString(16).padStart(2, '0')
  const b = Number(match[3]).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
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
  if (element && element !== body) {
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

export function getSelectionRectInDoc(doc: Document): DOMRect | null {
  const sel = doc.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null

  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return rect
}

export function getSelectedElementRectInDoc(doc: Document): DOMRect | null {
  const el = getSelectedElement(doc)
  if (!el || el === doc.body) return null
  return el.getBoundingClientRect()
}

function findMovableBlock(el: HTMLElement, body: HTMLElement): HTMLElement | null {
  if (el === body) return null
  let current: HTMLElement | null = el
  while (current && current !== body) {
    if (BLOCK_TAGS.has(current.tagName.toLowerCase())) return current
    current = current.parentElement
  }
  return el !== body ? el : null
}

export function moveSelectedElement(doc: Document, direction: 'up' | 'down'): boolean {
  const body = doc.body
  if (!body) return false

  const el = getSelectedElement(doc)
  if (!el) return false

  const block = findMovableBlock(el, body)
  if (!block || block === body) return false

  const sibling = direction === 'up' ? block.previousElementSibling : block.nextElementSibling
  if (!sibling) return false

  if (direction === 'up') {
    block.parentNode?.insertBefore(block, sibling)
  } else {
    block.parentNode?.insertBefore(sibling, block)
  }

  selectElement(doc, block)
  return true
}

export function duplicateSelectedElement(doc: Document): HTMLElement | null {
  const body = doc.body
  if (!body) return null

  const el = getSelectedElement(doc)
  if (!el) return null

  const block = findMovableBlock(el, body)
  if (!block || block === body) return null

  const clone = block.cloneNode(true) as HTMLElement
  clone.removeAttribute('data-editor-selected')
  block.parentNode?.insertBefore(clone, block.nextSibling)
  selectElement(doc, clone)
  return clone
}

export function removeSelectedElement(doc: Document): boolean {
  const body = doc.body
  if (!body) return false

  const el = getSelectedElement(doc)
  if (!el) return false

  const block = findMovableBlock(el, body)
  if (!block || block === body) return false

  block.remove()
  return true
}

/** ドラッグ並べ替えの対象：選択ブロックの兄弟要素の矩形と現在位置。 */
export function getMovableSiblingRectsInDoc(
  doc: Document,
): { rects: DOMRect[]; currentIndex: number } | null {
  const body = doc.body
  if (!body) return null

  const el = getSelectedElement(doc)
  if (!el) return null

  const block = findMovableBlock(el, body)
  if (!block) return null

  const parent = block.parentElement
  if (!parent) return null

  const children = Array.from(parent.children) as HTMLElement[]
  if (children.length < 2) return null

  const rects = children.map((child) => child.getBoundingClientRect())
  const currentIndex = children.indexOf(block)
  if (currentIndex < 0) return null

  return { rects, currentIndex }
}

export function moveSelectedToIndex(doc: Document, index: number): boolean {
  const body = doc.body
  if (!body) return false

  const el = getSelectedElement(doc)
  if (!el) return false

  const block = findMovableBlock(el, body)
  if (!block) return false

  const parent = block.parentElement
  if (!parent) return false

  const children = Array.from(parent.children) as HTMLElement[]
  const from = children.indexOf(block)
  const to = Math.max(0, Math.min(index, children.length - 1))
  if (from < 0 || from === to) return false

  const reference = children[to]
  if (!reference) return false

  if (to < from) {
    parent.insertBefore(block, reference)
  } else {
    parent.insertBefore(block, reference.nextSibling)
  }

  selectElement(doc, block)
  return true
}

export function getSlideElements(doc: Document): HTMLElement[] {
  const body = doc.body
  if (!body) return []
  return Array.from(body.querySelectorAll('section.slide, #deck > .slide'))
}

export function goToSlide(doc: Document, index: number): void {
  const slides = getSlideElements(doc)
  const slide = slides[index]
  if (!slide) return
  selectElement(doc, slide)
  slide.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function selectElement(doc: Document, el: HTMLElement): void {
  const sel = doc.getSelection()
  if (!sel) return

  const range = doc.createRange()
  range.selectNodeContents(el)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  updateSelectionHighlight(doc)
}

export function insertHtmlAtSelection(doc: Document, html: string): void {
  const body = doc.body
  if (!body) return

  body.focus()
  const sel = doc.getSelection()
  const template = doc.createElement('template')
  template.innerHTML = html.trim()
  const fragment = template.content

  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(fragment)
    const lastNode = fragment.lastChild
    if (lastNode) {
      range.setStartAfter(lastNode)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  } else {
    body.appendChild(fragment)
  }

  updateSelectionHighlight(doc)
}

export function stripEditorChrome(html: string): string {
  return html
    .replace(/\s*data-editor-selected="[^"]*"/g, '')
    .replace(/\s*data-editor-block="[^"]*"/g, '')
}
