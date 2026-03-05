# NEXT_TASKS.md — 次のタスク

## 優先タスク

- [x] **Linksセクション パワーアップ** — 4カテゴリ（YouTube/X/TRPG Scenarios/Goods）分割、カルーセルUI、YouTube RSS + BOOTH OGP 自動取得、GitHub Actions 3時間ごと自動更新
- [ ] **ナビバー改修** — ACHIEVEMENTSをプルダウン化（20XX年のリスト表示）、YouTube～GamesをCONTENTSプルダウンに集約
- [ ] **お問い合わせフォームの設置** — コンタクトフォームをページに追加
- [ ] **ゲームカードにリンク設定** — 「お祓いシミュレーター」カードを `<a>` タグに変更
- [ ] **OGPメタタグ追加** — SNS共有時のプレビュー表示用
- [ ] **OGP用画像の生成・設置**
- [ ] **Git初期化 + GitHub リポジトリ作成**
- [ ] **GitHub Pages でのデプロイ**
- [ ] **アバター画像の差し替え**
- [ ] **About セクションの文章確定**
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
- [x] LinksセクションカルーセルUI（`data/links.json` + 動的描画、YouTube RSS自動取得、BOOTH OGPスクレイピング）
- [x] リンクエディタ作成（`tools/link-editor.html` GUI + `editor-server.py` API拡張）
- [x] `start.bat` を `editor-server.py` ベースに切り替え（API対応、ページ読み込み時自動取得）
- [x] GitHub Actions ワークフロー（`.github/workflows/update-links.yml` 3時間ごと定期実行）
- [x] モニターブート演出改良（iframe読み込み完了待ち、nobootインラインスクリプト）
- [x] プロフィール更新（KAWAKEN、Virtual YouTuber | Scenario Writer）
- [x] ナビバーをYouTube/Scenarios/Goods/X/Gamesに分割
- [x] ページ読み込み時スクロール位置を最上部にリセット
