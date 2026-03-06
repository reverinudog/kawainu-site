# NEXT_TASKS.md — 次のタスク

## 優先タスク

- [ ] **訪問者カウンターアニメーション修正** — 全桁が同時に0からカウントアップする方式に変更（現在は桁ごとに個別で遅い）
- [ ] **Achievements タイムライン縦線の隙間修正** — 表示部分と「以前の歩みを見る」展開後の間にできる縦線の隙間をぴったりくっつける
- [ ] **スマホ縦画面対応の改善** — スマホの縦画面（ポートレート）で全セクションが見やすいようにレスポンシブ修正
- [ ] **アバター画像の差し替え**
- [ ] **将来的: 独自ドメイン取得**
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
- [x] OGPメタタグ追加（Open Graph + Twitter Card、`assets/ogp.png` バナー画像）
- [x] お祓いシミュレーター統合（`games/oharai/` リンク設定、デバッグパネル除去、不要ファイル除去、戻るボタン追加）
- [x] Contentsセクションタイトル追加（Achievementsと同じUI）
- [x] ナビバードロップダウン矢印の位置調整
- [x] favicon 設定（SVG/ICO/apple-touch-icon、`<head>` リンクタグ追加）
- [x] 文言修正（タブタイトル・ナビロゴ・OGP → 「KAWAKEN OFFICIAL」統一）
- [x] About セクション文章更新（本番テキスト + ランダム一言10パターン + 締めの言葉）
- [x] ブート演出ズームイン左上ずれ修正（transform-origin 逆算＋1px手動補正）
- [x] Achievements 最新2年初期表示＋「以前の歩みを見る」展開ボタン＋ナビドロップダウン制限
- [x] Games セクションを Contents 内に統合（link-category UI統一、カルーセル形式、4つ以上でページング）
- [x] お祓いシミュレーター改修: ダイス落下検知（Y < -20判定、「ごめん、ダイス落ちた・・・」演出、デバッグパネル`?debug=1`対応）
- [x] 訪問者カウンターUI追加（14桁レトロオドメーター、Cloudflare Workers + KV バックエンド、F5連打対策、カウントアップアニメーション、デモモード）
- [x] Cloudflare Pages デプロイ（GitHub連携自動デプロイ、Pages Functions → Worker統合、KVバインディング、wrangler.toml設定）
