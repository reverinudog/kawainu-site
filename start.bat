@echo off

REM ポート8090の既存プロセスを自動終了（サーバー重複防止）
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8090 ^| findstr LISTENING') do (
    echo [クリーンアップ] ポート8090使用中のプロセス %%a を終了します...
    taskkill /F /PID %%a >nul 2>&1
)

REM バッチファイルのあるディレクトリに移動（日本語パス対応）
cd /d "%~dp0"

REM サーバーをバックグラウンドで起動（--directoryは使わない）
start "" /B python -m http.server 8090

REM サーバー起動を待ってからブラウザを開く
timeout /t 2 /nobreak >nul
start "" http://localhost:8090

echo サーバー稼働中 (ポート 8090)
pause >nul
