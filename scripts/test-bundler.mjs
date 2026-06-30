import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function isBundlerHtml(html) {
  return html.includes('type="__bundler/template"')
}

function extractBundlerTemplate(html) {
  const templateOpen = '<script type="__bundler/template">'
  const templateStart = html.indexOf(templateOpen)
  const jsonStart = templateStart + templateOpen.length
  const templateClose = html.indexOf('</script>', jsonStart)
  const templateHtml = JSON.parse(html.slice(jsonStart, templateClose).trim())
  const manifestMatch = html.match(/<script type="__bundler\/manifest">\s*([\s\S]*?)\s*<\/script>/)
  const manifest = manifestMatch ? JSON.parse(manifestMatch[1]) : {}
  return {
    prefix: html.slice(0, jsonStart),
    suffix: html.slice(templateClose),
    templateHtml,
    manifest,
  }
}

function countSlides(bodyHtml) {
  const slides = bodyHtml.match(/<section class="slide/g) || []
  return slides.length
}

const deckPath = path.resolve(__dirname, '../test用/税理士のためのAI活用デッキ.html')
const html = fs.readFileSync(deckPath, 'utf8')

if (!isBundlerHtml(html)) throw new Error('Not bundler html')

const { templateHtml, manifest } = extractBundlerTemplate(html)
const bodyMatch = templateHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
const slideCount = countSlides(bodyMatch?.[1] ?? '')

console.log('Template chars:', templateHtml.length)
console.log('Manifest assets:', Object.keys(manifest).length)
console.log('Slides:', slideCount)

if (slideCount < 1) throw new Error('No slides found')
if (!templateHtml.includes('section class="slide')) throw new Error('Slide markup missing')

console.log('✅ Bundler slide deck can be parsed')
