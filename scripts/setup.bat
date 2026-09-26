@echo off
setlocal enabledelayedexpansion
pushd "%~dp0.."

echo ===================================================
echo   DogFood Platform - Full Environment Setup
echo ===================================================
echo.

echo [1/4] Setting up environment variables...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" > nul
    echo   Created backend\.env
) else (
    echo   backend\.env already exists.
)

if not exist ".env" (
    copy ".env.example" ".env" > nul
    echo   Created root .env
) else (
    echo   root .env already exists.
)

echo.
echo [2/4] Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo.
echo [3/4] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Setting up the Database...
cd backend
call npx prisma generate
call npx prisma db push --accept-data-loss
cd ..

echo.
echo ===================================================
echo   Setup Complete!
echo ===================================================
echo To start the platform, simply run:
echo.
echo    run.bat
echo.
echo Once running, open http://localhost:3000
echo ===================================================
pause
popd
