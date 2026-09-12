@echo off
chcp 65001 > nul
echo ========================================================
echo   Запуск Boogu Studio (Web / PWA / Multiplatform)
echo   Откройте в браузере: http://localhost:5173
echo   Или с телефона в той же сети Wi-Fi (IP будет показан ниже)
echo ========================================================
npm run dev -- --host
pause
