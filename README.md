# HTML編集アプリ

ブラウザ上でHTMLファイルを開き、WYSIWYGで編集・ダウンロードできる個人向けツールです。

## 機能

- HTMLファイルのドラッグ＆ドロップ / ファイル選択で読み込み
- 左: 対象HTMLのプレビュー画面（WYSIWYG編集）
- 右: 編集ダッシュボード（装飾・挿入・ダウンロード）
- `<head>` 内（CSS・meta等）は保持し、`<body>` のみ編集
- 編集後のHTMLダウンロード

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

1. GitHub リポジトリの **Settings → Pages → Build and deployment** で **GitHub Actions** を選択
2. `main` ブランチへ push すると `.github/workflows/deploy.yml` が自動デプロイします
3. 公開 URL: https://nozutax.github.io/HTMLeditApp/

## 技術スタック

- Vite + React + TypeScript
- Tailwind CSS
- iframe + contentEditable による WYSIWYG
