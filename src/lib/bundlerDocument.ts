import { stripEditorChrome } from './editorChrome'

export interface BundlerManifestEntry {
  mime: string
  compressed: boolean
  data: string
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

async function decompressGzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  await writer.write(new Uint8Array(bytes))
  await writer.close()
  const reader = ds.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

export function isBundlerHtml(html: string): boolean {
  return html.includes('type="__bundler/template"')
}

export function extractBundlerTemplate(html: string): {
  prefix: string
  suffix: string
  templateHtml: string
  manifest: Record<string, BundlerManifestEntry>
} {
  const templateOpen = '<script type="__bundler/template">'
  const templateStart = html.indexOf(templateOpen)
  if (templateStart === -1) {
    throw new Error('バンドル形式のHTMLですが、テンプレートが見つかりません')
  }

  const jsonStart = templateStart + templateOpen.length
  const templateClose = html.indexOf('</script>', jsonStart)
  if (templateClose === -1) {
    throw new Error('バンドル形式のHTMLですが、テンプレートの終端が見つかりません')
  }

  const templateJson = html.slice(jsonStart, templateClose).trim()
  let templateHtml: string
  try {
    templateHtml = JSON.parse(templateJson) as string
  } catch {
    throw new Error('バンドルテンプレートのJSON解析に失敗しました')
  }

  const manifestMatch = html.match(/<script type="__bundler\/manifest">\s*([\s\S]*?)\s*<\/script>/)
  const manifest = manifestMatch
    ? (JSON.parse(manifestMatch[1]!) as Record<string, BundlerManifestEntry>)
    : {}

  return {
    prefix: html.slice(0, jsonStart),
    suffix: html.slice(templateClose),
    templateHtml,
    manifest,
  }
}

export async function unpackBundlerTemplate(
  templateHtml: string,
  manifest: Record<string, BundlerManifestEntry>,
): Promise<string> {
  let result = templateHtml

  for (const [uuid, entry] of Object.entries(manifest)) {
    let bytes = base64ToBytes(entry.data)
    if (entry.compressed) {
      if (typeof DecompressionStream === 'undefined') {
        console.warn(`DecompressionStream unavailable, skipping asset ${uuid}`)
        continue
      }
      bytes = await decompressGzip(bytes)
    }
    const dataUrl = `data:${entry.mime};base64,${bytesToBase64(bytes)}`
    result = result.split(uuid).join(dataUrl)
  }

  return result
}

export function countSlides(bodyHtml: string): number {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${bodyHtml}</body>`, 'text/html')
  return doc.querySelectorAll('section.slide, .slide').length
}

export function mergeBundlerTemplateBody(templateHtml: string, editedBodyHtml: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(templateHtml, 'text/html')
  if (!doc.body) return templateHtml

  doc.body.innerHTML = stripEditorChrome(editedBodyHtml)

  const doctype = templateHtml.match(/<!DOCTYPE[^>]*>/i)?.[0] ?? '<!DOCTYPE html>'
  const htmlAttrs = Array.from(doc.documentElement.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(' ')
  const bodyAttrs = Array.from(doc.body.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(' ')

  const htmlAttrStr = htmlAttrs ? ` ${htmlAttrs}` : ''
  const bodyAttrStr = bodyAttrs ? ` ${bodyAttrs}` : ''

  return `${doctype}
<html${htmlAttrStr}>
<head>
${doc.head?.innerHTML ?? ''}
</head>
<body${bodyAttrStr}>
${doc.body.innerHTML}
</body>
</html>`
}

export function repackBundlerHtml(shell: { prefix: string; suffix: string }, templateHtml: string): string {
  return `${shell.prefix}${JSON.stringify(templateHtml)}${shell.suffix}`
}
