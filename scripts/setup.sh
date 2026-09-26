#!/bin/bash

# Determine project root dynamically
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==================================================="
echo "  HackNext Platform - Full Environment Setup"
echo "==================================================="
echo ""
echo "Project root: $PROJECT_ROOT"
echo ""

echo "[1/4] Setting up environment variables..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "  Created backend/.env"
else
    echo "  backend/.env already exists."
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  Created root .env"
else
    echo "  root .env already exists."
fi

echo ""
echo "[2/4] Installing Backend Dependencies..."
cd backend
npm install
cd ..

echo ""
echo "[3/4] Installing Frontend Dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "[4/4] Setting up the Database..."
cd backend
npx prisma generate
npx prisma db push --accept-data-loss
cd ..

echo ""
echo "==================================================="
echo "  Setup Complete!"
echo "==================================================="
echo "To start the platform, open two terminals:"
echo ""
echo "Terminal 1:"
echo "cd backend && npm run dev"
echo ""
echo "Terminal 2:"
echo "cd frontend && npm run dev"
echo ""
echo "Once running, open http://localhost:3000"
echo "==================================================="
