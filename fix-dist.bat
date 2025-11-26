@echo off
cd backend
if exist dist (
    echo Removing dist folder...
    rmdir /s /q dist 2>nul
    timeout /t 1 /nobreak >nul
)
echo Starting backend...
call npm run start:dev
