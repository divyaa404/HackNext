# 🛠️ HackNext Platform - Complete Commands & Operations Guide

Comprehensive reference guide for running, managing, testing, maintaining, and resetting the HackNext Platform across Docker, CLI tools, Prisma database management, and local development environments.

---

## ⚡ 1. Quick-Start Launchers (Zero-Config Scripts)

The repository provides automated scripts for instant cross-platform setup and execution.

### Windows (Batch / PowerShell)
```cmd
# Automated Interactive Launcher (Runs Docker, Local Dev, CLI, or Volume Reset)
run.bat

# Complete automated dependency & database setup script
scripts\setup.bat
# or via PowerShell:
.\setup.ps1
```

### Linux / macOS (Bash / Makefile)
```bash
# Automated setup (Environment variables, dependencies, Prisma client, and DB push)
./setup.sh
# or
chmod +x scripts/setup.sh && ./scripts/setup.sh

# Using Makefile
make setup
make run
```

---

## 🚀 2. Instant Platform Bootstrap (Docker)

To bootstrap the entire platform from a fresh clone with PostgreSQL, backend, frontend, seeds, and root organizer:

```bash
# 1. Start containers in detached mode
docker compose up -d --build

# 2. Sync database schema
docker compose exec backend npx prisma db push --accept-data-loss

# 3. Seed demo data (optional)
docker compose exec backend npm run seed

# 4. Generate Root Master Organizer Credentials
docker compose exec backend npm run organizer:reset
```
> **Note:** The `organizer:reset` command will output a temporary Organizer ID (`ORG-MASTER`) and a passkey. Log in at `http://localhost:3000/admin/login` to set your permanent password.

---

## 💻 3. Docker Management & Container Lifecycle

### Start & Stop
```bash
# Start all services with live console logs
docker compose up --build

# Start in background (detached)
docker compose up -d --build

# Stop all running containers
docker compose down

# Stop containers and destroy PostgreSQL data volumes (resets database)
docker compose down -v
```

### 🧹 Container, Image & Volume Reset / Deletion Commands

When resetting your test environment, updating schema/dependencies, or freeing disk space:

```bash
# 1. Stop all containers and remove containers, networks, volumes, AND compose images
docker compose down -v --rmi all --remove-orphans

# 2. Delete HackNext project images explicitly
docker rmi hacknext-backend hacknext-frontend

# 3. Remove all stopped containers
docker container prune -f

# 4. Remove all dangling and unused images
docker image prune -a -f

# 5. Remove all unused Docker volumes
docker volume prune -f

# 6. Complete Docker Factory Reset (Wipes all unused containers, networks, images & volumes)
docker system prune -a --volumes -f
```

### Inspecting Logs & Container Status
```bash
# Check status of running containers
docker compose ps

# Follow logs from all services
docker compose logs -f

# Follow logs from specific services
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Executing Commands & Opening Shell in Containers
```bash
# Open interactive shell in backend container
docker compose exec backend sh

# Open interactive shell in frontend container
docker compose exec frontend sh

# Open PostgreSQL CLI (psql) inside the database container
docker compose exec db psql -U postgres -d hackathon_db
```

### Building & Running Standalone Containers Manually
```bash
# Build standalone images
cd backend && docker build -t hacknext-backend . && cd ..
cd frontend && docker build -t hacknext-frontend . && cd ..

# Run standalone backend (Port 4000)
docker run -p 4000:4000 --env-file backend/.env hacknext-backend

# Run standalone frontend (Port 3000)
docker run -p 3000:3000 hacknext-frontend
```

---

## 🎮 4. CLI & Administrative Management Tools

The platform contains interactive and scriptable CLI tools for server administration, password recovery, and event management.

### Interactive Control Panel CLI
Provides an interactive menu for setting public URLs, viewing active organizer IDs, resetting passwords, and resetting the database.

```bash
# Inside Docker (Host machine):
docker compose exec backend npm run cli

# Local environment (inside /backend folder):
cd backend
npm run cli
# or via ts-node directly:
npx ts-node scripts/cli.ts
```

### Master Organizer Setup & Reset
```bash
# Create Master Organizer (Runs only if no organizer exists)
npm run setup:master
# or inside Docker:
docker compose exec backend npm run setup:master

# Force Reset Master Organizer Password / Passkey
npm run organizer:reset
# or with a custom ID:
npx ts-node scripts/organizer-reset.ts ORG-2026
# inside Docker:
docker compose exec backend npm run organizer:reset
```

### Database Seeding & Date Utilities
```bash
# Seed full hackathon demo environment (Events, Rubrics, Judges, Teams, Submissions)
npm run seed
# or inside Docker:
docker compose exec backend npm run seed

# Fix or align event timeline milestone dates
npx ts-node scripts/fix-event-dates.ts
# inside Docker:
docker compose exec backend npx ts-node scripts/fix-event-dates.ts
```

---

## 🗄️ 5. Database & Prisma Commands

All Prisma commands can be executed in the `backend` directory or via `docker compose exec backend`.

```bash
cd backend

# 1. Generate Prisma Client (Run after updating prisma/schema.prisma)
npx prisma generate

# 2. Push schema changes directly to the database without creating migration files
npx prisma db push --accept-data-loss

# 3. Force-reset the database (Wipes all tables and reapplies the schema)
npx prisma db push --force-reset

# 4. Open Prisma Studio (Interactive database visual UI at http://localhost:5555)
npx prisma studio

# 5. Create a new database migration (Production mode)
npx prisma migrate dev --name <migration_name>

# 6. Apply pending migrations (Production deployment)
npx prisma migrate deploy
```

---

## 💻 6. Local Development (Without Docker)

To run the application locally on your host machine without Docker:

### Prerequisites
- Node.js 18+ & npm
- PostgreSQL 15+ running locally (or configured in `backend/.env` `DATABASE_URL`)

### Backend Setup (Port 4000)
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma client and initialize database
npx prisma generate
npx prisma db push --accept-data-loss

# Start backend in hot-reload development mode
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

### Frontend Setup (Port 3000)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🧪 7. Automated Acceptance & Testing Suite

Run the end-to-end acceptance suite to verify API endpoints, authentication flows, role enforcement, event timeline limits, and submission workflows:

```bash
# Run comprehensive Python acceptance test suite
python scripts/run_acceptance_suite.py

# Run Bash acceptance suite (Linux / macOS / Git Bash)
./scripts/run-acceptance-suite.sh

# Verify offline / air-gapped readiness
./scripts/verify-offline.sh
```

---

## 🌐 8. Default Ports & Access URLs

| Service / Tool | URL | Description |
| :--- | :--- | :--- |
| **Participant Portal** | `http://localhost:3000/` | Public hackathon page, team registration, project submission |
| **Organizer / Admin Login** | `http://localhost:3000/admin/login` | Organizer dashboard, judging assignment, certificate generator |
| **Staff & Judge Portal** | `http://localhost:3000/staff/login` | Judge scoring panel, criteria rubrics evaluation |
| **Backend API** | `http://localhost:4000/api` | REST API routes & Swagger documentation |
| **Prisma Studio UI** | `http://localhost:5555/` | Database GUI (run `npx prisma studio`) |
