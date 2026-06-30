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
  await page.waitForSelector('text=編集ダッシュボード')
  await page.waitForSelector('iframe[title="HTMLプレビュー"]')

  const iframe = page.frameLocator('iframe[title="HTMLプレビュー"]')
  await iframe.locator('h1').waitFor({ timeout: 5000 })
  const h1Text = await iframe.locator('h1').textContent()
  if (!h1Text?.includes('HTML編集アプリのテスト')) {
    throw new Error(`見出しの読み込み失敗: ${h1Text}`)
  }
  console.log('   ✓ 左側プレビューにHTMLが表示された')

  console.log('3. レイアウトを確認...')
  const dashboard = page.locator('aside:has-text("編集ダッシュボード")')
  const preview = page.locator('main:has-text("プレビュー")')
  if (!(await dashboard.isVisible()) || !(await preview.isVisible())) {
    throw new Error('左右分割レイアウトが表示されていない')
  }
  console.log('   ✓ 左プレビュー・右ダッシュボードのレイアウト')

  console.log('4. 太字編集をテスト...')
  const body = iframe.locator('body')
  await body.click()
  await page.keyboard.press('Control+A')
  await page.locator('button[title="太字"]').click()
  await page.waitForTimeout(500)

  const boldCount = await iframe.locator('strong, b').count()
  if (boldCount === 0) throw new Error('太字の適用に失敗')
  console.log('   ✓ ダッシュボードから太字が適用された')

  console.log('5. ダウンロードをテスト...')
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

  console.log('6. 本番ビルドの確認...')
  await page.goto('http://localhost:4173/HTMLeditApp/')
  await page.waitForSelector('text=HTMLファイルをここにドロップ', { timeout: 5000 })
  console.log('   ✓ 本番ビルドがブラウザで動作する')

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
