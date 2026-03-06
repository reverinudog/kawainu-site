# ARCHITECTURE.md — プロジェクト構造

## ファイル構成

```
個人サイト/
├── index.html      # メインHTML（5セクション構成: Hero/About/Achievements/Contents/Contact）
├── style.css       # 全スタイル（ダークテーマ、レスポンシブ）
├── main.js         # ブート演出、パーティクル背景、スクロール制御、実績JSON読み込み、リンクカルーセル、ナビドロップダウン制御
├── start.bat       # ローカルHTTPサーバー起動（ポート8090）
├── assets/
│   ├── avatar.png  # アバター画像（仮置き）
│   ├── favicon.svg # SVG favicon（モダンブラウザ用）
│   ├── favicon.ico # ICO favicon（16/32/48px マルチサイズ）
│   ├── favicon-512.png   # PWAスプラッシュ用アイコン
│   ├── favicon-192.png   # Android Chrome ホーム画面用
│   ├── apple-touch-icon.png  # iOS ホーム画面用
│   ├── monitor.svg # 起動演出用PCモニターSVG
│   └── ogp.png     # OGP用バナー画像（1200×630px）
├── data/
│   ├── achievements.json  # 実績データ（JSON、外部管理）
│   └── links.json         # リンクデータ（カテゴリ別、YouTube/BOOTH/X）
├── tools/
│   ├── achievement-editor.html  # 実績登録GUI（ブラウザベース）
│   ├── link-editor.html         # リンク管理GUI（YouTube RSS + BOOTH OGP 自動取得）
│   ├── editor-server.py         # カスタムサーバー（OGP取得・JSON保存・リンク自動取得API）
│   └── start-editor.bat         # エディタ用サーバー起動（ポート8091）
├── games/
│   └── oharai/              # お祓いシミュレーター
│       ├── index.html       # エントリHTML（Three.js/Cannon-es ESM import）
│       ├── main.js          # ゲームロジック（914行、3D物理シミュレーション）
│       └── style.css        # ゲームUI・エフェクトスタイル
├── ARCHITECTURE.md # 本ファイル
├── GEMINI.md       # AI向け行動ルール
├── README.md       # プロジェクト概要
└── docs/
    └── NEXT_TASKS.md # タスク管理
```

## index.html セクション構成

| セクション | 要素 | 概要 |
|------------|------|------|
| `#hero` | アバター、名前（川犬/KAWAINU）、タグライン、スクロールヒント | ファーストビュー |
| `#about` | 自己紹介カード（about-card）、ランダム一言 | プロフィール |
| `#achievements` | 年次タイムライン（JS動的描画）、最新2年のみ初期表示、「以前の歩みを見る」展開ボタン | 実績 |
| `#links` | カテゴリ別ブロック（YouTube/BOOTH×2/X/Games）、カルーセルUI（JS動的描画）、Gamesは静的HTML | Contents |
| `#contact` | お問い合わせフォーム（Formspree対応、送信完了UI） | コンタクト |
| `#footer` | ロゴ、コピーライト | フッター |

## style.css 構造

| セクション | 行範囲 | 概要 |
|------------|--------|------|
| Reset & Base | 1-25 | リセット、body 基本設定 |
| パーティクル背景 | 27-36 | Canvas 固定背景 |
| ナビゲーション | 38-112 | 固定ナビ、スクロール時ブラー、ドロップダウン（Achievements▾/Contents▾） |
| Section 共通 | 114-155 | タイトル、リビールアニメ |
| Hero | 157-286 | アバター・グロー・名前・スクロールヒント |
| About | 288-328 | カード、glassmorphism |
| Links | 330-411 | リンクカード（YouTube赤/X白/BOOTH赤） |
| Games | 413-512 | ゲームカード、バウンスアニメ |
| Footer | 514-541 | フッター |
| レスポンシブ | 543-592 | 768px / 480px ブレークポイント |
| Monitor Boot Sequence | 594- | SVGモニター起動演出（iframe実サイト表示、ビューポート比率動的適応、5フェーズズームイン） |

## main.js 構造

| セクション | 概要 |
|------------|------|
| monitorBootSequence() | SVGモニター起動演出（ビューポート比率適応、iframe実サイト表示、画面中央→VP中央の transform-origin 逆算ズーム） |
| fetch('data/achievements.json') | 外部JSONから実績データを読み込み → renderAchievements(data) |
| renderAchievements(data) | タイムラインDOM動的生成（最新2年のみ初期表示、古い年は `.timeline-hidden`、展開ボタン付き） |
| updateAchievementsDropdown() | ナビバーAchievementsドロップダウンの年リスト更新（展開前: 最新2年のみ、展開後: 全年表示） |
| loadLinks() + renderLinks() | リンクデータ読み込み → カテゴリ別カルーセルDOM生成、Games ブロック末尾移動 |
| setupGamesCarousel() | Games カルーセル初期化（4つ以上でページングボタン表示） |
| Particle (class) | Canvas パーティクル（60個、緑グロー、接続線） |
| animateParticles() | rAF ループ |
| ナビスクロール + ドロップダウン | 80px 超えで `.scrolled` 付与、ドロップダウン開閉制御（クリック/ESC/外部クリック） |
| スクロールリビール | IntersectionObserver で `[data-reveal]` + タイムライン要素 → `.revealed` |
| スムーズスクロール | ナビリンククリック時 |
| アバターホバー | スケール 1.05 エフェクト |
| カスタムカテゴリセレクト | ナビバー風ドロップダウン、クリックトグル/外部クリック閉じ |
| Aboutランダム一言 | ページ読み込みごとに10パターンからランダム表示 |
| お問い合わせフォーム | Formspree対応送信、ハニーポットチェック、送信完了UI |

## お祓いシミュレーター (`games/oharai/`)

| ファイル | 概要 |
|----------|------|
| `index.html` | エントリHTML、Three.js / Cannon-es を ESM importmap で読み込み |
| `main.js` | ゲームロジック（914行）: 3Dシーン・物理演算・ダイス生成/投擲・結果判定・演出 |
| `style.css` | ゲームUI（HUD・ボタン・結果オーバーレイ・各種エフェクト） |

### main.js 主要機能

| 関数/セクション | 概要 |
|----------------|------|
| シーン初期化 | Three.js レンダラー/カメラ/ライト（スポット/リム/コーナー）、CANNON.js 物理ワールド |
| createDice() / spawnDice() | 100面ダイス（IcosahedronGeometry）を100個生成・物理演算付き投擲 |
| generateResults() | ダイス停止後に全ダイスの出目を判定（クリティカル1/ファンブル100カウント） |
| displayResults() / showStatsOverlay() | 結果表示UI、統計オーバーレイ |
| showCelebration() | クリティカル優勢時の紙吹雪🎉演出 |
| showDisappointment() | ファンブル優勢時の紫の雨💀演出 |
| showNeutral() | 同数時のまあまあ演出 |
| showExplosion() | ファンブル10超え時の爆発演出（UI破壊→復帰） |
| takeScreenshot() / shareToX() | スクリーンショット撮影、X共有 |
| roll() | ロール状態管理（投擲→安定待ち→結果判定→演出） |

## 依存関係（CDN）

- Google Fonts: Orbitron, Noto Sans JP, Inter
- サードパーティライブラリ（メインサイト）: なし
- お祓いシミュレーター: Three.js, Cannon-es（ESM importmap）
