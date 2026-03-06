# ARCHITECTURE.md — プロジェクト構造

## ファイル構成

```
個人サイト/
├── index.html      # メインHTML（6セクション構成）
├── style.css       # 全スタイル（ダークテーマ、レスポンシブ）
├── main.js         # ブート演出、パーティクル背景、スクロール制御、実績JSON読み込み、リンクカルーセル、ナビドロップダウン制御
├── start.bat       # ローカルHTTPサーバー起動（ポート8090）
├── assets/
│   ├── avatar.png  # アバター画像（仮置き）
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
│   └── oharai/              # お祓いシミュレーター（統合済み、index.html/main.js/style.css）
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
| `#about` | 自己紹介カード（about-card） | プロフィール |
| `#achievements` | 年次タイムライン（JS動的描画）、年マーカー●、実績カード | 実績 |
| `#links` | カテゴリ別ブロック（YouTube/BOOTH×2/X）、カルーセルUI（JS動的描画） | リンク |
| `#games` | ゲームカード×2（お祓いシミュレーター + Coming Soon） | ミニゲーム |
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
| monitorBootSequence() | SVGモニター起動演出（ビューポート比率適応、iframe実サイト表示、transform-origin逆算ズーム） |
| fetch('data/achievements.json') | 外部JSONから実績データを読み込み → renderAchievements(data) |
| renderAchievements(data) | タイムラインDOM動的生成（年マーカー●、アイテムカード、エンドマーカー） |
| Particle (class) | Canvas パーティクル（60個、緑グロー、接続線） |
| animateParticles() | rAF ループ |
| ナビスクロール + ドロップダウン | 80px 超えで `.scrolled` 付与、ドロップダウン開閉制御（クリック/ESC/外部クリック） |
| スクロールリビール | IntersectionObserver で `[data-reveal]` + タイムライン要素 → `.revealed` |
| スムーズスクロール | ナビリンククリック時 |
| アバターホバー | スケール 1.05 エフェクト |
| カスタムカテゴリセレクト | ナビバー風ドロップダウン、クリックトグル/外部クリック閉じ |
| お問い合わせフォーム | Formspree対応送信、ハニーポットチェック、送信完了UI |

## 依存関係（CDN）

- Google Fonts: Orbitron, Noto Sans JP, Inter
- サードパーティライブラリ: なし
