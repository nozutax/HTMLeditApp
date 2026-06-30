import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sampleHtml = path.resolve(__dirname, '../sample/test.html')
const downloadDir = path.resolve(__dirname, '../.test-downloads')

async function main() {
  fs.mkdirSync(downloadDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()

  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))

  console.log('1. アプリを開く...')
  await page.goto('http://localhost:5173/HTMLeditApp/')
  await page.waitForSelector('text=HTMLファイルをアップロード')

  console.log('2. HTMLファイルをアップロード...')
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles(sampleHtml)
  await page.waitForSelector('text=パーツ')
  await page.waitForSelector('iframe[title="HTMLプレビュー"]')

  const iframe = page.frameLocator('iframe[title="HTMLプレビュー"]')
  await iframe.locator('h1').waitFor({ timeout: 5000 })
  const h1Text = await iframe.locator('h1').textContent()
  if (!h1Text?.includes('HTML編集アプリのテスト')) {
    throw new Error(`見出しの読み込み失敗: ${h1Text}`)
  }
  console.log('   ✓ 中央キャンバスにHTMLが表示された')

  console.log('3. レイアウトを確認...')
  const partsPanel = page.locator('aside:has-text("パーツ")')
  const inspector = page.locator('aside:has-text("インスペクター")')
  const toolbar = page.locator('header:has-text("HTML編集アプリ")')
  if (!(await partsPanel.isVisible()) || !(await inspector.isVisible()) || !(await toolbar.isVisible())) {
    throw new Error('3ゾーンレイアウトが表示されていない')
  }
  console.log('   ✓ 上部ツールバー・左パーツ・右インスペクターのレイアウト')

  console.log('4. 連続入力をテスト...')
  const frameHandle = await page.locator('iframe[title="HTMLプレビュー"]').elementHandle()
  const contentFrame = await frameHandle?.contentFrame()
  if (!contentFrame) throw new Error('iframeにアクセスできない')

  const typed = await contentFrame.evaluate(() => {
    const p = document.querySelector('p')
    if (!p) return ''
    p.focus()
    const range = document.createRange()
    range.selectNodeContents(p)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    for (const c of ['あ', 'い', 'う']) {
      document.execCommand('insertText', false, c)
    }
    return p.textContent ?? ''
  })
  if (!typed.includes('あいう')) {
    throw new Error(`連続入力に失敗: ${typed}`)
  }
  console.log('   ✓ 連続して文字入力できた')

  console.log('5. 太字編集をテスト...')
  const boldApplied = await contentFrame.evaluate(() => {
    const p = document.querySelector('p')
    if (!p) return false
    const range = document.createRange()
    range.selectNodeContents(p)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    return document.execCommand('bold', false)
  })
  if (!boldApplied) throw new Error('太字の適用に失敗')
  const boldCount = await iframe.locator('p strong, p b').count()
  if (boldCount === 0) throw new Error('太字タグが見つからない')
  console.log('   ✓ 太字が適用された')

  console.log('6. パーツ挿入をテスト...')
  await page.locator('button[title="区切り線"]').click()
  await page.waitForTimeout(300)
  const hrCount = await iframe.locator('hr').count()
  if (hrCount === 0) throw new Error('パーツ挿入に失敗')
  console.log('   ✓ パーツパネルから区切り線が挿入された')

  console.log('7. ダウンロードをテスト...')
  const downloadPromise = page.waitForEvent('download')
  await page.locator('button:has-text("ダウンロード")').click()
  const download = await downloadPromise
  const downloadPath = path.join(downloadDir, 'downloaded.html')
  await download.saveAs(downloadPath)

  const downloaded = fs.readFileSync(downloadPath, 'utf-8')
  if (!downloaded.includes('<head>') || !downloaded.includes('HTML編集アプリのテスト')) {
    throw new Error('ダウンロードHTMLの内容が不正')
  }
  if (!downloaded.includes('<style>')) {
    throw new Error('head内のstyleが保持されていない')
  }
  console.log('   ✓ 完全なHTMLがダウンロードされた')

  console.log('8. 本番ビルドの確認...')
  const previewPorts = [4173, 4174, 4175, 4176, 4177]
  let previewOk = false
  for (const port of previewPorts) {
    try {
      await page.goto(`http://localhost:${port}/HTMLeditApp/`, { timeout: 3000 })
      await page.waitForSelector('text=HTMLファイルをアップロード', { timeout: 3000 })
      previewOk = true
      console.log(`   ✓ 本番ビルドがブラウザで動作する (port ${port})`)
      break
    } catch {
      // try next port
    }
  }
  if (!previewOk) {
    throw new Error('本番プレビューサーバーに接続できません。npm run preview を起動してください')
  }

  if (errors.length > 0) {
    console.warn('ページエラー:', errors)
  }

  await browser.close()
  fs.rmSync(downloadDir, { recursive: true, force: true })

  console.log('\n✅ すべてのブラウザテストに合格しました')
}

main().catch((err) => {
  console.error('\n❌ テスト失敗:', err.message)
  process.exit(1)
})
