# GEMINI.md — AI向け行動ルール

## デバッグ・画面検証方針

- **簡単な確認**: ユーザーが自分でデバッグする（AIは手順を示すだけ）
- **複雑な確認**: AIがブラウザサブエージェントで画面検証を行う
- **そのままでは検証が難しい場合**: 以下のいずれかで対応する
  - デバッグツールを作成する（**main/master ブランチには含めないこと**。feature ブランチまたは `/tmp/` に置く）
  - 一時的な検証用スクリプトを `/tmp/` に書いて確認する
- **サーバー起動時の注意**: ユーザーは `start.bat`（`editor-server.py`、ポート8090）を使用する。AIがサーバーを起動する場合はポート競合に注意し、既存プロセスの確認・killを行うこと

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
- **safe-area修正済み**: モバイルメディアクエリ（≤600px, ≤480px）が `#overlay` と `#back-to-site` の safe-area padding を上書きしていたのを修正。`max()` + `env(safe-area-inset-top)` で対応
- **ダイス結果パネル全行表示**: `aspect-ratio: auto` + `padding: 3-4px 0` でセルを横長化、`overflowY: hidden` で48vh内にスクロールなし全10行収容
- **リザルト動的配置は全サイズ対応**: `applyMobileMsgStyle` と `showStatsOverlay` の rAF 配置をデスクトップでも実行。CSS `.result-message` の `translateY(-50%)` は除去済み（`translateX(-50%)`のみ）
- **絵文字のモバイル制御**: `emojiScale` 係数 0.22-0.30（大幅縮小）、個数半減、配置範囲を上部(5-25%)に制限。`stats-overlay` は z-index:110 で絵文字の上に表示
- **iPhone比率テスト**: テスト時は iPhone 比率（例: 390×844 = iPhone 14）を使うこと。400×830 は iPhone 比率ではない

## 現在のブランチ状態

- `develop` ← **現在地**（リザルト表示デスクトップ/モバイル両対応済み）
- `master` ← developと同期未実施（次回マージ待ち）
- `feature/debug-result-check` ← マージ済み（削除可）
