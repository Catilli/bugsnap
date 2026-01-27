@echo off
echo ===================================
echo BugSnap - Clean Restart Script
echo ===================================
echo.

echo [1/6] Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Done!
echo.

echo [2/6] Cleaning Next.js cache...
cd apps\web
if exist .next (
    rmdir /s /q .next
    echo .next folder deleted
) else (
    echo .next folder not found, skipping...
)
cd ..\..
echo Done!
echo.

echo [3/6] Cleaning node_modules\@prisma...
if exist node_modules\@prisma (
    rmdir /s /q node_modules\@prisma
    echo @prisma folder deleted
) else (
    echo @prisma folder not found, skipping...
)
echo Done!
echo.

echo [4/6] Reinstalling dependencies...
call npm install
echo Done!
echo.

echo [5/6] Generating Prisma Client...
cd apps\api
call npx prisma generate
cd ..\..
echo Done!
echo.

echo [6/6] Starting servers...
echo.
echo Starting API Server...
start "BugSnap API" cmd /k "cd apps\api && npm run dev"
timeout /t 5 /nobreak >nul

echo Starting Web App...
start "BugSnap Web" cmd /k "cd apps\web && npm run dev"

echo.
echo ===================================
echo Servers are starting!
echo ===================================
echo API Server: http://localhost:3001
echo Web App: http://localhost:3000
echo.
echo Wait for both terminals to show "Ready"
echo then open http://localhost:3000 in your browser
echo.
pause