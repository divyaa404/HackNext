#!/usr/bin/env bash

# ==============================================================================
# HackNext Platform - Interactive Setup Script (Portable by Design)
# ==============================================================================

set -e

# Determine project root dynamically
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=================================================================="
echo "  🚀 HackNext Platform - First-Time Setup Wizard"
echo "=================================================================="
echo ""
echo "Configuring environment variables and ports for your machine..."
echo ""

generate_random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
  else
    head /dev/urandom | tr -dc A-Za-z0-9 | head -c 24
  fi
}

ENV_FILE=".env"
FORCE_SETUP=false

if [ "$1" == "--force" ] || [ "$1" == "-f" ]; then
  FORCE_SETUP=true
fi

if [ -f "$ENV_FILE" ] && [ "$FORCE_SETUP" = false ]; then
  echo "✅ Configuration file (.env) already exists."
  echo "Skipping prompts (idempotent). To reconfigure, run: ./setup.sh --force"
  echo ""
else
  DEFAULT_DB_USER="postgres"
  DEFAULT_DB_NAME="hackathon_db"
  DEFAULT_DB_PORT="5432"
  DEFAULT_BACKEND_PORT="4000"
  DEFAULT_FRONTEND_PORT="3000"
  AUTO_DB_PASS=$(generate_random_secret | head -c 16)
  AUTO_JWT_SECRET=$(generate_random_secret)

  # Interactive Configuration
  read -p "Database Name [$DEFAULT_DB_NAME]: " INPUT_DB_NAME
  DB_NAME=${INPUT_DB_NAME:-$DEFAULT_DB_NAME}

  read -p "Database User [$DEFAULT_DB_USER]: " INPUT_DB_USER
  DB_USER=${INPUT_DB_USER:-$DEFAULT_DB_USER}

  read -p "Database Password [Press Enter to auto-generate]: " INPUT_DB_PASS
  DB_PASSWORD=${INPUT_DB_PASS:-$AUTO_DB_PASS}

  read -p "Database Port [$DEFAULT_DB_PORT]: " INPUT_DB_PORT
  DB_PORT=${INPUT_DB_PORT:-$DEFAULT_DB_PORT}

  read -p "Backend API Port [$DEFAULT_BACKEND_PORT]: " INPUT_BACKEND_PORT
  BACKEND_PORT=${INPUT_BACKEND_PORT:-$DEFAULT_BACKEND_PORT}

  read -p "Frontend Web Port [$DEFAULT_FRONTEND_PORT]: " INPUT_FRONTEND_PORT
  FRONTEND_PORT=${INPUT_FRONTEND_PORT:-$DEFAULT_FRONTEND_PORT}

  JWT_SECRET="$AUTO_JWT_SECRET"

  echo ""
  echo "👤 First-Run Organizer Setup"
  echo "--------------------------------------------------"
  read -p "Configure Organizer login now? [Y/n]: " CREATE_ORG_CHOICE
  CREATE_ORG_CHOICE=${CREATE_ORG_CHOICE:-Y}

  INIT_ORG_NAME=""
  INIT_ORG_EMAIL=""
  INIT_ORG_PASS=""
  INIT_ORG_COLLEGE=""

  if [[ "$CREATE_ORG_CHOICE" =~ ^[Yy]$ ]]; then
    read -p "Organizer Name [Admin Organizer]: " INPUT_ORG_NAME
    INIT_ORG_NAME=${INPUT_ORG_NAME:-"Admin Organizer"}

    read -p "Organizer Email [admin@hackathon.local]: " INPUT_ORG_EMAIL
    INIT_ORG_EMAIL=${INPUT_ORG_EMAIL:-"admin@hackathon.local"}

    AUTO_ORG_PASS=$(generate_random_secret | head -c 12)
    read -p "Organizer Password [Press Enter to auto-generate: $AUTO_ORG_PASS]: " INPUT_ORG_PASS
    INIT_ORG_PASS=${INPUT_ORG_PASS:-$AUTO_ORG_PASS}

    read -p "Organization Name [Hackathon Platform]: " INPUT_ORG_COLLEGE
    INIT_ORG_COLLEGE=${INPUT_ORG_COLLEGE:-"Hackathon Platform"}
  fi

  DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"

  # Write root .env
  cat <<EOF > .env
# Database Configuration
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=$DB_PORT
DATABASE_URL="$DATABASE_URL"

# Application Ports
PORT=$BACKEND_PORT
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT

# Authentication & Security
JWT_SECRET="$JWT_SECRET"
VITE_API_URL=/api

# Root Organizer Credentials
INITIAL_ORGANIZER_NAME="$INIT_ORG_NAME"
INITIAL_ORGANIZER_EMAIL="$INIT_ORG_EMAIL"
INITIAL_ORGANIZER_PASSWORD="$INIT_ORG_PASS"
INITIAL_ORG_NAME="$INIT_ORG_COLLEGE"
EOF

  echo "  ✓ Generated .env"

  mkdir -p backend
  cat <<EOF > backend/.env
DATABASE_URL="$DATABASE_URL"
JWT_SECRET="$JWT_SECRET"
PORT=$BACKEND_PORT
EOF
  echo "  ✓ Generated backend/.env"
fi

source .env 2>/dev/null || true

echo ""
echo "=================================================================="
echo "  🎉 Setup Ready!"
echo "=================================================================="
echo "  Frontend URL: http://localhost:${FRONTEND_PORT:-3000}"
echo "  Backend API:  http://localhost:${BACKEND_PORT:-4000}"
echo "  Database Port:${DB_PORT:-5432}"
echo ""
if [ -n "$INITIAL_ORGANIZER_PASSWORD" ]; then
  echo "  Organizer Login Credentials:"
  echo "  Email:    $INITIAL_ORGANIZER_EMAIL"
  echo "  Password: $INITIAL_ORGANIZER_PASSWORD"
  echo ""
fi
echo "Start with Docker:"
echo "  docker compose up"
echo ""
echo "Or start locally with npm:"
echo "  cd backend && npm install && npx prisma db push && npm run dev"
echo "  cd frontend && npm install && npm run dev"
echo "=================================================================="
