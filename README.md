# HTML編集アプリ

ブラウザ上でHTMLファイルをアップロードし、編集してダウンロードするツールです。データはブラウザに保存されません。

## 機能

- HTMLファイルのアップロード（ドラッグ＆ドロップ / ファイル選択）
- 上部：常設リッチツールバー（書式・見出し・色・デバイス切替・保存）
- 左：パーツ挿入パネル（見出し・ボタン・表・2カラムなど）
- 中央：WYSIWYG編集キャンバス（PC/タブレット/スマホ幅切替）
- 右：インスペクター（選択要素の属性編集）
- テキスト選択時のフローティングツールバー
- 要素選択時の移動・複製・削除ハンドル
- 編集完了後にHTMLをダウンロード

## 使い方

```bash
npm install
npm run dev      # http://localhost:5173/HTMLeditApp/
npm run build    # 本番ビルド → dist/
npm run preview  # ビルド成果物のプレビュー
```

`sample/test.html` をアップロードして動作確認できます。

## ブラウザテスト

```bash
npm run dev      # 別ターミナルで起動
npm run preview  # 別ターミナルで起動
npm run test:browser
```

## GitHub Pages への公開

リポジトリ名が `HTMLeditApp` の場合、`vite.config.ts` の `base: '/HTMLeditApp/'` が必要です（未設定だと JS/CSS が 404 になり真っ白になります）。

1. GitHub リポジトリの **Settings → Pages → Build and deployment** で以下を設定
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages` / `/ (root)`
2. `main` ブランチへ push すると `.github/workflows/deploy.yml` が `dist` を `gh-pages` ブランチへ自動デプロイします
3. 公開 URL: https://nozutax.github.io/HTMLeditApp/

## 技術スタック

- Vite + React + TypeScript
- Tailwind CSS
- iframe + contentEditable による WYSIWYG
