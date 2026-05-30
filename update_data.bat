@echo off
REM =====================================================
REM  update_data.bat
REM  ログ + holdings_live.json から data.json を生成して
REM  GitHub に push → Vercel 自動デプロイ
REM =====================================================

SET BOT_DIR=C:\Users\Owner\Desktop\claude\daytrade_bot
SET DASH_DIR=C:\Users\Owner\Desktop\claude\daytrade_dashboard
SET LIVE_JSON=%BOT_DIR%\logs\holdings_live.json

echo ============================================
echo  Daytrade Dashboard 更新スクリプト
echo ============================================

echo.
echo [1/3] data.json を生成中...

REM ログファイルを自動収集（logsフォルダ内の全.logファイル）
SET LOG_FILES=
FOR %%f IN ("%BOT_DIR%\logs\*.log") DO SET LOG_FILES=!LOG_FILES! "%%f"

python "%DASH_DIR%\scripts\log_to_json.py" ^
  --logs "%BOT_DIR%\logs\20260527.log" ^
        "%BOT_DIR%\logs\20260528.log" ^
        "%BOT_DIR%\logs\20260529.log" ^
  --live-holdings "%LIVE_JSON%" ^
  --output "%DASH_DIR%\public\data.json"

if %errorlevel% neq 0 (
  echo エラー: log_to_json.py が失敗しました
  pause
  exit /b 1
)

echo.
echo [2/3] Git にコミット中...
cd /d "%DASH_DIR%"
git add public\data.json
git commit -m "data: update %date% %time:~0,5%"

echo.
echo [3/3] GitHub に push 中...
git push origin main

echo.
echo ============================================
echo  完了！Vercel が自動デプロイを開始します
echo  約1分後にサイトに反映されます
echo  https://daytrade-dashboard-omega.vercel.app/
echo ============================================
pause
