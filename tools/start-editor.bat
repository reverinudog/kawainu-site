@echo off

REM ポート8091の既存プロセスを自動終了（サーバー重複防止）
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8091 ^| findstr LISTENING') do (
    echo [クリーンアップ] ポート8091使用中のプロセス %%a を終了します...
    taskkill /F /PID %%a >nul 2>&1
)

REM バッチファイルのあるディレクトリに移動（日本語パス対応）
cd /d "%~dp0"

REM カスタムサーバーをバックグラウンドで起動（ポート8091）
start "" /B python editor-server.py 8091

REM サーバー起動を待ってからブラウザを開く
timeout /t 3 /nobreak >nul
start "" http://localhost:8091/tools/achievement-editor.html

echo 実績エディタ サーバー稼働中 (ポート 8091)
pause >nul
