# GEMINI.md — AI向け行動ルール

## サーバー起動について

- **テスト目的でも HTTP サーバーを勝手に起動しないこと**
- ユーザーは必ず `start.bat` を手動で実行してサーバーを起動する
- `start.bat` は `editor-server.py`（ポート8090）を使用。ページ読み込み時にYouTube RSS + BOOTH OGPを自動取得
- AI がサーバーを起動すると、ユーザーの `start.bat` とポートが競合し 404 エラーの原因になる
- 動作確認が必要な場合は、ユーザーに `start.bat` の実行を依頼すること

## デザイン仕様

- テーマカラー: **黒 (`#050508`) × ネオングリーン (`#00ff6a`)**
- VTuber名: **川犬**（英字表記: KAWAKEN）
- タグライン: Virtual YouTuber | Scenario Writer
- アバター画像: `assets/avatar.png`（仮置き、ユーザーが後で差し替え予定）

## コンテンツ編集ルール

- About セクションの自己紹介文は仮テキスト。変更する場合はユーザーに確認すること
- SNSリンクのURL変更はユーザー確認必須

## NEXT_TASKS.md 完了ルール

- タスク完了時、`docs/NEXT_TASKS.md` の該当タスクを必ず `[x]` に更新すること
- 新しいタスクが発生した場合は「優先タスク」セクションに追加すること

## Git ブランチ運用

- **`master`**: 本番ブランチ。プッシュすると **Cloudflare Pages が自動デプロイ** する
- **`develop`**: 開発ブランチ。普段の作業はすべてここで行う
- AI（このファイルを読むあなた）は **必ず `develop` ブランチで作業すること**
- `master` への直接コミット・プッシュは禁止（壊れたコードが本番に出るため）
- 本番反映時: `develop` → `master` にマージ → 自動デプロイ
- 引き継ぎ時のコミット＆プッシュも `develop` に対して行うこと

## デプロイ構成

- **ホスティング**: Cloudflare Pages（GitHub連携、master ブランチ自動デプロイ）
- **カウンターAPI**: `src/worker.js`（Cloudflare Workers、同一ドメイン `/api/count`）
- **KV ストレージ**: `VISITOR_KV`（訪問者カウント保存）
- **設定ファイル**: `wrangler.toml`（KVバインディング、アセットディレクトリ）

## お祓いシミュレーター モバイルレイアウト知見

- **リザルトメッセージとstats枠は固定%ではなく動的配置**: `requestAnimationFrame` + `getBoundingClientRect()` で「ボタン行の下端」と「ダイスグリッドの上端」を取得し、px単位で配置する
- **`applyMobileMsgStyle(msg)`を全演出関数で呼ぶ**: `showCelebration`, `showDisappointment`, `showNeutral`, `showDiceFallen`, `showExplosion` の全5関数で必須
- **results-panelの縮小**: モバイル時は `48vh` に縮小して上部に演出用スペースを確保（`displayResults`で設定、`hideResults`でリセット）
- **safe-area未解決**: `env(safe-area-inset-top)` + `viewport-fit=cover` を追加済みだが、CSSの競合でUI全体が下にずれていない→次チャットで調査・修正が必要

## 現在のブランチ状態

- `feature/debug-result-check` ← **現在地**（デバッグパネル常時表示 + モバイル修正）
- `develop` ← リザルト修正はコミット済み（a3fe7d2）。feature/debug-result-checkの追加修正はまだマージされていない
- safe-area修正・動的配置・フォントサイズ統一の変更は `feature/debug-result-check` にのみ存在
