@echo off
echo Fixing dist folder permission issue...
echo.

REM Kill any node processes that might be locking the dist folder
echo Stopping node processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

REM Try to remove dist folder
echo Removing dist folder...
if exist dist (
    rmdir /s /q dist 2>nul
    if exist dist (
        echo Failed to remove dist folder with normal permissions
        echo Trying with PowerShell...
        powershell -Command "Remove-Item -Path 'dist' -Recurse -Force -ErrorAction SilentlyContinue"
    )
)

REM Wait a bit
timeout /t 1 /nobreak >nul

REM Check if dist was removed
if exist dist (
    echo.
    echo ============================================
    echo ERROR: Could not remove dist folder
    echo Please manually:
    echo 1. Close all VSCode/IDE windows
    echo 2. Delete G:\orex-sfe\backend\dist folder manually
    echo 3. Run this script again
    echo ============================================
    pause
    exit /b 1
) else (
    echo Successfully removed dist folder
)

echo.
echo Building project...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! Build completed.
    echo You can now run: npm run start:dev
    echo ============================================
) else (
    echo.
    echo ============================================
    echo ERROR: Build failed
    echo ============================================
)

pause
