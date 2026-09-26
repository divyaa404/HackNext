# HackNext Platform

A portable, self-hostable hackathon management, submission, and multi-dimensional judging platform. Built to run on **ANY machine with zero manual configuration or hardcoded credentials.**

---

## 🚀 Quick Start for a New Machine

Clone the repository and launch the platform in two commands:

### Linux / macOS / WSL:
```bash
git clone https://github.com/indresh404/HackNext.git
cd HackNext
./setup.sh
docker compose up
```

### Windows (PowerShell):
```powershell
git clone https://github.com/indresh404/HackNext.git
cd HackNext
.\setup.ps1
docker compose up
```

---

## 🔑 First-Run Root Organizer Setup

No default or hardcoded admin/organizer passwords exist in this codebase. Whoever clones and deploys the platform creates their own master account:

### Option A: Interactive Terminal Setup (Default)
When you run `./setup.sh` or `.\setup.ps1`, the script prompts you to create your Root Organizer account (or auto-generates secure credentials if you press Enter).

### Option B: Browser Setup Wizard (`/setup`)
If you start Docker directly without running the setup script, open your browser at:
👉 **`http://localhost:3000/setup`**

The one-time Setup Wizard lets you:
1. Enter your Organizer Name, Email, and Organization.
2. 1-click auto-generate a secure master password.
3. Automatically initialize the database and log directly into the Organizer Dashboard.
*(Note: Once the first Organizer is created, the `/setup` endpoint is locked permanently and returns `403 Forbidden`)*.

---

## 🛠️ Portable Configuration & Environment Variables

All configuration is loaded via `.env` (derived from `.env.example`). No hardcoded ports or secret strings exist in the source code.

| Environment Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_USER` | PostgreSQL user | `hacknext` |
| `DB_PASSWORD` | PostgreSQL password | Auto-generated / `hacknextpassword` |
| `DB_NAME` | PostgreSQL database name | `hacknext` |
| `DB_PORT` | PostgreSQL host exposed port | `5432` |
| `BACKEND_PORT` | Express API server port | `4000` |
| `FRONTEND_PORT` | Vite React frontend port | `3000` |
| `JWT_SECRET` | Cryptographic secret for session tokens | Auto-generated random hex |
| `DATABASE_URL` | Complete Prisma connection string | `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}` |

To resolve any local port conflicts, simply modify the ports in your `.env` file before starting.

---

## 💻 Local Development (Without Docker)

If you prefer running services directly on your host machine:

1. **Configure Environment**:
   ```bash
   ./setup.sh    # (or .\setup.ps1)
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npm run dev
   ```

3. **Start Frontend** (in a separate terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Portals**:
   - **Participant & Public Portal:** `http://localhost:3000/`
   - **First-Run Setup Wizard:** `http://localhost:3000/setup`
   - **Admin / Judge / Staff Login:** `http://localhost:3000/admin/login`
   - **Judge Dashboard:** `http://localhost:3000/judge`

---

## 📚 Technical Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Data Model & Schema](docs/DATA-MODEL.md)
- [Judging Mechanics](docs/JUDGING.md)
- [Threat Model & Security](docs/THREAT-MODEL.md)
