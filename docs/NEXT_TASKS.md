# NEXT_TASKS.md — 次のタスク

## 優先タスク

- [ ] **お祓いシミュレーター統合** — 別ワークスペースから `games/oharai/` にコピー → Gamesカードからリンク
- [ ] **OGPメタタグ追加** — SNS共有時のプレビュー表示用
- [ ] **OGP用画像の生成・設置**
- [ ] **Git初期化 + GitHub リポジトリ作成**
- [ ] **GitHub Pages でのデプロイ**
- [ ] **アバター画像の差し替え**
- [ ] **About セクションの文章確定**
- [ ] **将来的: 独自ドメイン取得 + Cloudflare Pages 移行**
- [ ] **将来的: Cloudflare Turnstile 導入** — ハニーポットから Turnstile（無料）に切り替え、より強力なボット対策
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
- [x] ナビバー改修（About / Achievements▾ / Contents▾ / Contact のドロップダウン化、実績年リスト動的生成）
- [x] お問い合わせフォーム設置（Formspree対応、カスタムセレクト、ハニーポット、送信完了UI）
- [x] Linksセクション パワーアップ（4カテゴリ分割、カルーセルUI、YouTube RSS + BOOTH OGP 自動取得）
