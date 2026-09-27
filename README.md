# HackNext — Offline-First Collegiate Hackathon Management Platform

[![Offline First](https://img.shields.io/badge/Architecture-Offline--First-blue.svg)](#)
[![Theme](https://img.shields.io/badge/UI-Bauhaus%20Neo--Brutalist-red.svg)](#)
[![Dogfood](https://img.shields.io/badge/Dogfood%202026-T1--T4%20Claimed-success.svg)](#)

A self-hostable, offline-first hackathon lifecycle platform engineered for collegiate hackathons, high-stakes engineering sprints, and air-gapped campus environments. Built with zero external SaaS or cloud CDN dependencies.

---

## 🏛️ System Features

1. **Certificate Generation Studio (Vector SVG Engine)**
   - Modeled after parametric vector engines (`Certify`), rendering offline SVGs with mathematically scaled typography and layout.
   - Built-in templates: 1st Place, 2nd Place, 3rd Place, Participant, and custom track certificates.
   - Cryptographic SHA-256 integrity hash embedded into each certificate for offline public verification (`/verify/certificate/:id`).
   - Event toggle safety: `show_certificates` can only be turned on if certificates have already been generated.

2. **Community Project Voting & Results Podium**
   - Public project voting gallery displaying strictly **Project Title and Description**.
   - Strict 1-vote constraint per participant per event (no self-voting).
   - Real-time vote locking and automated rank sorting upon phase conclusion.
   - Interactive podium and leaderboard reveal on the main event page when results are published.

3. **5-Phase Event Lifecycle & Timeline Operations**
   - Predefined 5-step operational pipeline: `Registration` → `Project Submission` → `Evaluation` → `Community Voting` → `Result Out`.
   - Dynamic **`+1 Hour` Extension** and **`Close Phase Now`** controls for organizers.

4. **Multi-Criteria Scoring Rubrics & Judging**
   - Preloaded default 4-rubric criteria (Innovation 25%, Technical 30%, UI/UX 25%, Impact 20%).
   - Weighted score calculation with instant validation guaranteeing 100% total weight.
   - Adaptive judging with Z-Score normalization and strict role isolation (Judge B cannot view Judge A's evaluations).

5. **Full Server Backup & Atomic Restore**
   - Full JSON snapshot export (`/api/export/backup/full`) and atomic transactional restore (`/api/export/backup/restore`).
   - Detailed CSV export for evaluation scores and participant rosters.

6. **Bauhaus Neo-Brutalist Design System**
   - 4px solid borders, brutalist shadow geometry (`8px 8px 0px #000`), high contrast, dark mode support, and custom modal components (`UIModal.tsx`) with zero native `alert()` interruptions.

---

## 🚀 Quick Start

### 1. Requirements
- Node.js v20+ / npm
- PostgreSQL (or Docker Compose)
- Python 3.8+ (for acceptance test suite)

### 2. Local Setup
```bash
# Backend Setup
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Frontend Setup (in a separate terminal)
cd ../frontend
npm install
npm run dev
```

### 3. Acceptance Test Suite Verification
Run the automated Dogfood 2026 T1-T4 verification suite:
```bash
python run.py
```
This executes all 10 checks across T1 (Core), T2 (Judging & Security), T3 (Voting & Certificates), and T4 (Portability) and generates `docs/acceptance-report.txt`.

---

## 📁 Technical Documentation

- [Architecture & Subsystems](docs/ARCHITECTURE.md)
- [Relational Data Model](docs/DATA-MODEL.md)
- [Adaptive Dynamic Judging & Normalization](docs/JUDGING.md)
- [Threat Model & Security Mitigations](docs/THREAT-MODEL.md)
- [Mathematical Normalization Proof](docs/NORMALIZATION-PROOF.md)
- [REST API Specification (OpenAPI 3.0)](openapi.yaml)
- [Dogfood Specification Config](.dogfood.toml)
