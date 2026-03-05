# 川犬 — VTuber Official Site

VTuber「川犬」の個人サイト。黒×ネオングリーンのダークテーマで、パーティクル背景やスクロールリビールなどリッチな演出を搭載。

## 機能

- **ブート演出** — PCモニターSVGが電源ON→サイトが画面に映る→ズームインでシームレスに遷移
- **Hero** — アバター＋名前＋タグライン、回転グローエフェクト
- **About** — 自己紹介カード（仮テキスト）
- **Achievements** — 年次タイムライン（ジグザグレイアウト、外部JSON読み込み）
- **Links** — YouTube / X / BOOTH(シナリオ) / BOOTH(グッズ) への導線
- **Games** — ミニゲーム一覧（お祓いシミュレーターのカードあり）
- **パーティクル背景** — Canvas ベースの緑パーティクル＋接続線
- **スクロールリビール** — IntersectionObserver による登場アニメーション
- **レスポンシブ対応** — 768px / 480px ブレークポイント
- **実績エディタ** — ブラウザGUIで実績データを管理（JSON直接保存、OGPサムネイル自動取得）

## 技術構成

| 項目 | 内容 |
|------|------|
| 言語 | HTML / CSS / Vanilla JS / Python |
| フレームワーク | なし（静的サイト） |
| フォント | Google Fonts (Orbitron, Noto Sans JP, Inter) |
| ビルド | 不要 |
| メインサイト | ポート8090（start.bat） |
| 実績エディタ | ポート8091（tools/start-editor.bat） |

## 起動方法

```
start.bat をダブルクリック
→ http://localhost:8090 で表示
```

## SNSリンク

| サービス | URL |
|----------|-----|
| X | <https://x.com/reverinu_vtuber> |
| YouTube | <https://www.youtube.com/c/KawakenChannel?sub_confirmation=1> |
| BOOTH (TRPGシナリオ) | <https://reverinu.booth.pm/> |
| BOOTH (グッズ) | <https://reverinu-vtuber.booth.pm/> |

## デザイン仕様

- **テーマカラー**: 黒 (`#050508`) × ネオングリーン (`#00ff6a`)
- **アバター**: `assets/avatar.png` (仮置き、後で差し替え予定)
- **タイポグラフィ**: 見出しは Orbitron、本文は Noto Sans JP、英文UIは Inter
