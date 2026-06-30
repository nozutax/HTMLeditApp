import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const html = fs.readFileSync(
  path.resolve(__dirname, '../test用/税理士のためのAI活用デッキ.html'),
  'utf8',
)

const templateStart = html.indexOf('<script type="__bundler/template">')
const templateEnd = html.indexOf('</script>', templateStart)
const manifestStart = html.indexOf('<script type="__bundler/manifest">')
const extStart = html.indexOf('<script type="__bundler/ext_resources">')

console.log('file size', html.length)
console.log('manifest at', manifestStart)
console.log('ext at', extStart)
console.log('template at', templateStart, 'end', templateEnd)

console.log('\n--- Around manifest (200 chars) ---')
console.log(html.slice(manifestStart, manifestStart + 120))

console.log('\n--- Before manifest (last 300 chars) ---')
console.log(html.slice(manifestStart - 300, manifestStart))

// Parse template and find slide structure
const templateRaw = html.slice(
  html.indexOf('>', templateStart) + 1,
  templateEnd,
).trim()
const template = JSON.parse(templateRaw)

const slideSection = template.match(/class="[^"]*slide[^"]*"/gi)
console.log('\nSlide class samples:', slideSection?.slice(0, 8))

const bodyMatch = template.match(/<body[^>]*>([\s\S]*)<\/body>/i)
if (bodyMatch) {
  console.log('\nBody length in template:', bodyMatch[1].length)
  console.log('Body start:', bodyMatch[1].slice(0, 500))
}

// Check if slides use a specific component
const slideCssBlocks = template.match(/<style[^>]*>[\s\S]*?\.slide[\s\S]*?<\/style>/gi)
console.log('\nSlide CSS blocks:', slideCssBlocks?.length)
if (slideCssBlocks?.[0]) {
  console.log(slideCssBlocks[0].slice(0, 2500))
}

const slideRules = template.match(/\.slide[^{]*\{[^}]+\}/g)
fs.writeFileSync(path.resolve(__dirname, 'slide-rules.txt'), (slideRules || []).join('\n\n'))
console.log('\nWrote slide-rules.txt, count:', slideRules?.length)
