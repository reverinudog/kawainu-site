# NEXT_TASKS.md — 次のタスク

## 優先タスク

- [ ] **Linksセクション パワーアップ** — 4カテゴリ（YouTube/X/BOOTH TRPGシナリオ/BOOTHグッズ）を大きく分割し、各カテゴリ内で直近コンテンツをサムネイル付き横一覧表示。◀▶ボタンで次ページ読み込み。YouTube API / X埋め込み / BOOTHスクレイピング等の連携が必要
- [ ] **ゲームカードにリンク設定** — 「お祓いシミュレーター」カードを `<a>` タグに変更し、ダイスお祓いページへのリンクを設定（デプロイ後のURLに合わせて設定）
- [ ] **OGPメタタグ追加** — SNS共有時のプレビュー表示用（og:title, og:description, og:image）
- [ ] **OGP用画像の生成・設置** — SNS共有時に表示されるサムネイル画像
- [ ] **ゲームカード用サムネイル画像** — 絵文字(🎲)の代わりにリッチなサムネ画像を設定
- [ ] **Git初期化 + GitHub リポジトリ作成**
- [ ] **GitHub Pages でのデプロイ** — 無料で即日公開可能
- [ ] **アバター画像の差し替え** — ユーザーから正式画像を受け取った後に差し替え
- [ ] **About セクションの文章確定** — 仮テキストを正式プロフィールに更新
- [ ] **将来的: 独自ドメイン取得 + Cloudflare Pages 移行**
- [ ] **将来的: Google AdSense 申請・広告挿入**

## 完了済み

- [x] HTML構造（Hero/About/Links/Games/Footer 5セクション）
- [x] CSS（黒×ネオングリーン ダークテーマ、レスポンシブ対応）
- [x] パーティクル背景（Canvas、緑パーティクル＋接続線）
- [x] スクロールリビールアニメーション（IntersectionObserver）
- [x] ナビゲーション（固定ナビ、スクロール時ブラー背景）
- [x] リンクカード（YouTube/X/BOOTH×2）
- [x] ゲームカードUI（お祓いシミュレーター + Coming Soon）
- [x] start.bat（ポート8090、日本語パス対応）
- [x] アバター仮置き（`assets/avatar.png`）
- [x] モニターブート演出（SVGモニター電源ON→iframe実サイト表示→ズームイン遷移）
- [x] 実績セクション追加（ジグザグタイムライン、年グループ、スクロールリビール対応）
- [x] 実績登録ツール作成（`tools/achievement-editor.html` GUI + `tools/editor-server.py` カスタムサーバー、JSON直接保存・OGPサムネイル自動取得対応）
- [x] 実績データ外部JSON化（`data/achievements.json`、`main.js` は fetch ベースで読み込み）
