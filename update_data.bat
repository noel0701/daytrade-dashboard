@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

SET BOT_DIR=C:\Users\Owner\Desktop\claude\daytrade_bot
SET DASH_DIR=C:\Users\Owner\Desktop\claude\daytrade_dashboard
SET LIVE_JSON=%BOT_DIR%\logs\holdings_live.json

echo [1/3] Generating data.json...
python "%DASH_DIR%\scripts\log_to_json.py" --logs "%BOT_DIR%\logs\20260527.log" "%BOT_DIR%\logs\20260528.log" "%BOT_DIR%\logs\20260529.log" --live-holdings "%LIVE_JSON%" --output "%DASH_DIR%\public\data.json"

if %errorlevel% neq 0 (
  echo ERROR: log_to_json.py failed
  pause
  exit /b 1
)

echo [2/3] Git commit...
cd /d "%DASH_DIR%"
git add public\data.json
git commit -m "data: update"

echo [3/3] Git push...
git push origin main

echo Done!
echo https://daytrade-dashboard-omega.vercel.app/
pause
