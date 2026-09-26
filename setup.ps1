# ==============================================================================
# HackNext Platform - Windows PowerShell Interactive Setup Script
# ==============================================================================

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  🚀 HackNext Platform - First-Time Setup Wizard (Windows)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuring environment variables and ports for your machine..."
Write-Host ""

Function Generate-RandomSecret([int]$length = 16) {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $bytes = New-Object byte[] $length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $result = ""
    for ($i = 0; $i -lt $length; $i++) {
        $result += $chars[$bytes[$i] % $chars.Length]
    }
    return $result
}

$EnvFile = Join-Path $ProjectRoot ".env"
$Force = $args -contains "--force" -or $args -contains "-f"

if ((Test-Path $EnvFile) -and (-not $Force)) {
    Write-Host "✅ Configuration file (.env) already exists." -ForegroundColor Green
    Write-Host "Skipping prompts (idempotent). To reconfigure, run: .\setup.ps1 --force"
    Write-Host ""
} else {
    $DefaultDbUser = "postgres"
    $DefaultDbName = "hackathon_db"
    $DefaultDbPort = "5432"
    $DefaultBackendPort = "4000"
    $DefaultFrontendPort = "3000"
    $AutoDbPass = Generate-RandomSecret 16
    $AutoJwtSecret = Generate-RandomSecret 32

    $InputDbName = Read-Host "Database Name [$DefaultDbName]"
    $DbName = if ([string]::IsNullOrWhiteSpace($InputDbName)) { $DefaultDbName } else { $InputDbName }

    $InputDbUser = Read-Host "Database User [$DefaultDbUser]"
    $DbUser = if ([string]::IsNullOrWhiteSpace($InputDbUser)) { $DefaultDbUser } else { $InputDbUser }

    $InputDbPass = Read-Host "Database Password [Press Enter to auto-generate]"
    $DbPassword = if ([string]::IsNullOrWhiteSpace($InputDbPass)) { $AutoDbPass } else { $InputDbPass }

    $InputDbPort = Read-Host "Database Port [$DefaultDbPort]"
    $DbPort = if ([string]::IsNullOrWhiteSpace($InputDbPort)) { $DefaultDbPort } else { $InputDbPort }

    $InputBackendPort = Read-Host "Backend API Port [$DefaultBackendPort]"
    $BackendPort = if ([string]::IsNullOrWhiteSpace($InputBackendPort)) { $DefaultBackendPort } else { $InputBackendPort }

    $InputFrontendPort = Read-Host "Frontend Web Port [$DefaultFrontendPort]"
    $FrontendPort = if ([string]::IsNullOrWhiteSpace($InputFrontendPort)) { $DefaultFrontendPort } else { $InputFrontendPort }

    Write-Host ""
    Write-Host "👤 First-Run Organizer Setup" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------"
    $CreateOrgChoice = Read-Host "Configure Organizer login now? (Y/n) [Y]"
    if ([string]::IsNullOrWhiteSpace($CreateOrgChoice)) { $CreateOrgChoice = "Y" }

    $InitOrgName = ""
    $InitOrgEmail = ""
    $InitOrgPass = ""
    $InitOrgCollege = ""

    if ($CreateOrgChoice -match "^[Yy]") {
        $InputOrgName = Read-Host "Organizer Name [Admin Organizer]"
        $InitOrgName = if ([string]::IsNullOrWhiteSpace($InputOrgName)) { "Admin Organizer" } else { $InputOrgName }

        $InputOrgEmail = Read-Host "Organizer Email [admin@hackathon.local]"
        $InitOrgEmail = if ([string]::IsNullOrWhiteSpace($InputOrgEmail)) { "admin@hackathon.local" } else { $InputOrgEmail }

        $AutoOrgPass = Generate-RandomSecret 12
        $InputOrgPass = Read-Host "Organizer Password [Press Enter to auto-generate: $AutoOrgPass]"
        $InitOrgPass = if ([string]::IsNullOrWhiteSpace($InputOrgPass)) { $AutoOrgPass } else { $InputOrgPass }

        $InputOrgCollege = Read-Host "Organization Name [Hackathon Platform]"
        $InitOrgCollege = if ([string]::IsNullOrWhiteSpace($InputOrgCollege)) { "Hackathon Platform" } else { $InputOrgCollege }
    }

    $DatabaseUrl = "postgresql://${DbUser}:${DbPassword}@localhost:${DbPort}/${DbName}?schema=public"

    $EnvContent = @"
# Database Configuration
DB_USER=$DbUser
DB_PASSWORD=$DbPassword
DB_NAME=$DbName
DB_PORT=$DbPort
DATABASE_URL="$DatabaseUrl"

# Application Ports
PORT=$BackendPort
BACKEND_PORT=$BackendPort
FRONTEND_PORT=$FrontendPort

# Authentication & Security
JWT_SECRET="$AutoJwtSecret"
VITE_API_URL=/api

# Root Organizer Credentials
INITIAL_ORGANIZER_NAME="$InitOrgName"
INITIAL_ORGANIZER_EMAIL="$InitOrgEmail"
INITIAL_ORGANIZER_PASSWORD="$InitOrgPass"
INITIAL_ORG_NAME="$InitOrgCollege"
"@

    Set-Content -Path $EnvFile -Value $EnvContent
    Write-Host "  ✓ Generated .env" -ForegroundColor Green

    $BackendEnvFile = Join-Path $ProjectRoot "backend\.env"
    $BackendEnvContent = @"
DATABASE_URL="$DatabaseUrl"
JWT_SECRET="$AutoJwtSecret"
PORT=$BackendPort
"@
    Set-Content -Path $BackendEnvFile -Value $BackendEnvContent
    Write-Host "  ✓ Generated backend\.env" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  🎉 Setup Ready!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  Frontend URL: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "  Backend API:  http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  Database Port: $DbPort" -ForegroundColor White
Write-Host ""
Write-Host "Start with Docker:" -ForegroundColor Yellow
Write-Host "  docker compose up" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or start locally with npm:" -ForegroundColor White
Write-Host "  cd backend; npm install; npx prisma db push; npm run dev" -ForegroundColor Yellow
Write-Host "  cd frontend; npm install; npm run dev" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
