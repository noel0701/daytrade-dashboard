@echo off
REM =====================================================
REM  update_data.bat
REM  ログから data.json を再生成して GitHub に push する
REM  daytrade_bot フォルダと同じ場所に置いてください
REM =====================================================

SET BOT_DIR=C:\Users\Owner\Desktop\claude\daytrade_bot
SET DASH_DIR=C:\Users\Owner\Desktop\claude\daytrade_dashboard

echo [1/3] data.json を生成中...
python "%DASH_DIR%\scripts\log_to_json.py" ^
  --logs "%BOT_DIR%\logs\20260527.log" ^
        "%BOT_DIR%\logs\20260528.log" ^
        "%BOT_DIR%\logs\20260529.log" ^
  --output "%DASH_DIR%\public\data.json"

if %errorlevel% neq 0 (
  echo エラー: log_to_json.py が失敗しました
  pause
  exit /b 1
)

echo [2/3] Git にコミット中...
cd /d "%DASH_DIR%"
git add public/data.json
git commit -m "data: auto update %date% %time:~0,5%"

echo [3/3] GitHub に push 中...
git push origin main

echo.
echo ✅ 完了！Vercel が自動でデプロイを開始します
echo    約1分後にサイトに反映されます
pause
