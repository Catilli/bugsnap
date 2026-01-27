@echo off
echo Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting API Server...
start "BugSnap API" cmd /k "cd apps\api && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Web App...
start "BugSnap Web" cmd /k "cd apps\web && npm run dev"

echo.
echo Both servers are starting...
echo API Server will be at http://localhost:3001
echo Web App will be at http://localhost:3000
echo.
pause