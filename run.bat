@echo off
setlocal enabledelayedexpansion

:: Determine the true project root dynamically
set "PROJECT_ROOT=%~dp0"
:: Remove trailing backslash if present (though %~dp0 has it, it's safer to keep for appending or just pushd)
pushd "%PROJECT_ROOT%"

echo ========================================
echo  HACKNEXT PLATFORM
echo ========================================
echo.
echo Project root:
echo %PROJECT_ROOT%
echo.

:: Detect Docker Compose file
set "COMPOSE_FILE="
if exist "docker-compose.yml" set "COMPOSE_FILE=docker-compose.yml"
if exist "docker-compose.yaml" set "COMPOSE_FILE=docker-compose.yaml"
if exist "compose.yml" set "COMPOSE_FILE=compose.yml"
if exist "compose.yaml" set "COMPOSE_FILE=compose.yaml"

if "%COMPOSE_FILE%"=="" (
    echo [ERROR] Docker Compose file not found.
    echo.
    echo Expected one of:
    echo - docker-compose.yml
    echo - docker-compose.yaml
    echo - compose.yml
    echo - compose.yaml
    echo.
    echo Project directory:
    echo %PROJECT_ROOT%
    echo.
    echo Make sure the startup script is inside the project repository.
    pause
    popd
    exit /b 1
)

echo Docker Compose:
echo %PROJECT_ROOT%%COMPOSE_FILE%
echo.

:: Auto-Setup Environments for fresh clones
if not exist "backend\.env" (
    echo [Setup] Creating default backend\.env...
    copy "backend\.env.example" "backend\.env" > nul
)
if not exist ".env" (
    echo [Setup] Creating default root .env...
    copy ".env.example" ".env" > nul
)

echo Please ensure Docker Desktop is running before selecting Option 1, 3, or 4.
echo.
echo 1) Run with Docker (Recommended for Evaluators)
echo 2) Run Locally (Dev-Only - Requires Node.js ^& Postgres)
echo 3) Open Interactive CLI (Docker)
echo 4) Reset Docker Database ^& Volumes (Fixes credentials / fresh start)
echo 5) Exit
echo.
set /p choice="Select an option (1, 2, 3, 4, or 5): "

if "%choice%"=="1" goto opt1
if "%choice%"=="2" goto opt2
if "%choice%"=="3" goto opt3
if "%choice%"=="4" goto opt4
if "%choice%"=="5" goto opt5

echo Invalid option. Exiting.
pause
popd
exit /b 1

:opt5
popd
exit /b 0

:opt4
echo.
echo Stopping Docker containers and removing database volumes...
docker compose -f "%COMPOSE_FILE%" down -v
echo.
echo Database volume has been completely reset.
echo You can now start fresh with Option 1.
pause
popd
exit /b 0

:opt1
:: Check Docker availability
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or Docker Desktop is not running.
    pause
    popd
    exit /b 1
)
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or Docker Desktop is not running.
    pause
    popd
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop does not appear to be running. Please start it and try again.
    pause
    popd
    exit /b 1
)

echo.
echo Starting Docker containers...
docker compose -f "%COMPOSE_FILE%" up --build -d
if errorlevel 1 (
    echo [ERROR] Failed to start Docker containers. Check the Compose file and logs.
    pause
    popd
    exit /b 1
)

echo Waiting for backend container to be ready...
:wait_loop
docker compose -f "%COMPOSE_FILE%" exec backend node -e "process.exit(0)" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_loop
)

echo.
echo Running Database Migrations (Schema Push)...
docker compose -f "%COMPOSE_FILE%" exec backend npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo [ERROR] Migration failed - see logs above. Fix and rerun.
    pause
    popd
    exit /b 1
)

echo.
echo Seeding Default Data...
docker compose -f "%COMPOSE_FILE%" exec backend npm run seed
if errorlevel 1 (
    echo [ERROR] Seed failed - see logs above. Fix and rerun.
    pause
    popd
    exit /b 1
)

echo.
echo ===================================================
echo Stack is running at http://localhost:3000 !
echo.
echo Next step: Open a NEW terminal and run the interactive CLI to create your Organization:
echo   cd /d "%PROJECT_ROOT%"
echo   docker compose -f "%COMPOSE_FILE%" run --rm backend npm run cli
echo ===================================================
pause
popd
exit /b 0

:opt2
echo Starting Backend Server...
start cmd /k "cd backend && npm install && npx prisma generate && npm run dev"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm install && npm run dev"

echo Servers are starting in separate windows.
pause
popd
exit /b 0

:opt3
:: Check Docker availability
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or Docker Desktop is not running.
    pause
    popd
    exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop does not appear to be running. Please start it and try again.
    pause
    popd
    exit /b 1
)
echo Launching CLI via Docker...
docker compose -f "%COMPOSE_FILE%" run --rm backend npm run cli
pause
popd
exit /b 0
