# DogFood - Project Commands Guide

This document lists all the essential commands required to build, run, and manage the DogFood Hackathon Platform.

---

## 🚀 Running the Application (Local Development)

To run the application locally without Docker, you will need two separate terminal windows.

### Backend
Start the Node.js / Express backend server (runs on port `4000`):
```bash
cd backend
npm install
npm run dev
```

### Frontend
Start the React / Vite frontend development server (runs on port `3000`):
```bash
cd frontend
npm install
npm run dev
```

## 🚀 The Final Architecture (Bootstrap)

To instantly bootstrap the entire platform from scratch with absolute zero configuration, run these exactly in order:

```bash
docker compose up -d
docker compose exec backend npx prisma db push --accept-data-loss
docker compose exec backend npm run seed
docker compose exec backend npm run organizer:reset
```
*The `organizer:reset` command will print a one-time ID and temporary passkey to your terminal. You must log in with this, and the backend will mathematically force a password change on first login.*

---

## 💻 Docker Commands (Detailed)
This will build and start both the frontend and backend containers automatically:
```bash
docker compose up --build
```
*(Use `docker compose up -d --build` to run them in the background / detached mode).*

### Stop Docker Containers
```bash
docker compose down
```

### Build Individual Images
If you want to manually build the Docker images:
```bash
# Build Backend Image
cd backend
docker build -t dogfood-backend .

# Build Frontend Image
cd frontend
docker build -t dogfood-frontend .
```

### Run Individual Containers
```bash
# Run Backend Container (exposing port 4000)
docker run -p 4000:4000 dogfood-backend

# Run Frontend Container (exposing port 3000)
docker run -p 3000:3000 dogfood-frontend
```

---

## 🛠️ CLI & Management Commands (Backend)

The backend includes several management scripts for initializing the database and creating administrative users. **All commands below must be run inside the `backend` directory.**

### Database Setup & Prisma
```bash
# Generate the Prisma Client (Run this after any schema changes)
npx prisma generate

# Push schema changes to the SQLite database
npx prisma db push

# Open Prisma Studio to manually view and edit the database UI
npx prisma studio
```

### Administrative CLI Commands
```bash
# Interactive CLI tool for managing the platform via terminal
npm run cli
```
*(Note: If you are running the platform via Docker, you can access this CLI from your host machine by running `docker compose exec backend npm run cli`)*

---

## 📦 Build Commands (Production)

To compile the TypeScript code for production deployment.

### Build Backend
```bash
cd backend
npm run build
```
*This compiles the `src` directory into the `dist` folder.*

### Build Frontend
```bash
cd frontend
npm run build
```
*This compiles the React app into optimized static files in the `dist` directory.*
