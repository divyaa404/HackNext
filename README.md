# HackNext — Offline-First Collegiate Hackathon Management Platform

[![Offline First](https://img.shields.io/badge/Architecture-Offline--First-blue.svg)](#)
[![Theme](https://img.shields.io/badge/UI-Bauhaus%20Neo--Brutalist-red.svg)](#)
[![Dogfood](https://img.shields.io/badge/Dogfood%202026-T1--T4%20Claimed%20(100%25)-success.svg)](#)
[![Tests](https://img.shields.io/badge/Acceptance%20Suite-10%2F10%20Passed-emerald.svg)](#)

**HackNext** is an air-gapped, self-hostable hackathon lifecycle and judging platform engineered specifically for university hackathons, collegiate engineering sprints, and isolated campus networks. It requires **zero external cloud SaaS, CDN dependencies, or external telemetry**.

---

## 🏛️ Core Platform Architecture & Features

### 1. Judge Evaluation Studio (Streamlined 4-in-1 Scorecards)
- **High-Usability Scorecards in 1 Row**: 4 clean scorecards side-by-side representing evaluation criteria (Innovation, Technical Architecture, UI/UX Usability, Presentation/Pitch).
- **Pure Numeric Input & Steppers**: Fast, distraction-free score entry with integer keyboard input, intuitive `[-]` / `[+]` single-point steppers, auto-clamping, and visual score fill indicators.
- **Side-by-Side Slide Deck Inspection**: Integrated high-resolution presentation deck viewer with fit-to-slide, fit-to-width, and fullscreen inspection controls.
- **Adaptive Normalization Engine**: Automatically applies Z-Score cross-judge normalization ($\mu=65, \sigma=15$) to eliminate human grading bias.
- **Strict Role Isolation**: Prevents peer judges from snooping on rival jury evaluations (returns `HTTP 403 Forbidden`).

### 2. Certificate Generation Studio (Parametric SVG Engine)
- **Vector SVG Generation Engine**: Modeled after parametric vector engines (`Certify`), generating high-fidelity vector awards locally on disk at `uploads/certificates/<eventId>/<certNo>.svg`.
- **Configurable Templates**: Built-in templates for **1st Place Winner**, **2nd Place Winner**, **3rd Place Winner**, **Participant**, and custom track awards.
- **Cryptographic SHA-256 Signature**: Every certificate embeds an immutable SHA-256 checksum calculated from recipient identity, event, award tier, and timestamp.
- **Public Verification Endpoint**: Public offline verification portal at `/verify/certificate/:id` dynamically re-computes and verifies authenticity.
- **Safety Prerequisite Toggle**: The event edit toggle `show_certificates` can **strictly only be enabled** after certificates have been generated for the event.

### 3. Community Project Voting & Results Podium
- **Sanitized Public Project Gallery**: Public cards show **strictly Project Title and Description** to maintain a clean voting ballot.
- **Strict 1-Vote Constraint**: Authenticated participants can cast **strictly 1 vote per event** (self-team voting is rejected).
- **Automated Rank Sorting**: Votes are locked and sorted automatically upon phase closure.
- **Main Page Podium Reveal**: Live 🥇 Gold, 🥈 Silver, and 🥉 Bronze podium cards and full leaderboard display directly on the public hackathon page once results are published.

### 4. 5-Phase Event Lifecycle & Real-Time Operational Deadlines
- **Predefined Operational Pipeline**:
  1. `Registration` (Participant onboarding & team formation)
  2. `Project Submission` (Deck, repo link, and demo submission)
  3. `Evaluation` (Jury scoring across weighted criteria)
  4. `Community Voting` (Title & description project ballots)
  5. `Result Out` (Podium reveal, certificates, and final standings)
- **Live Deadline Extension (+1 Hour)**: Organizers can extend any active deadline by `+1 Hour` with a single click or trigger `Close Phase Now`.

### 5. Scoring Rubrics Customization
- **Preloaded Default Criteria**: Seeded with default 4 criteria (Innovation 25%, Technical 30%, UI/UX 25%, Impact 20%).
- **Weight Calculation**: Instant validation guaranteeing total weights equal exactly 100%.

### 6. Full Server Disaster Recovery (Export & Atomic Restore)
- **Full Database JSON Export**: Complete database state snapshot (`/api/export/backup/full`).
- **Atomic Transactional Restore**: Re-imports all tables inside a single `prisma.$transaction` block (`/api/export/backup/restore`).
- **CSV Scoring Dumps**: Instant CSV export of judge ratings and participant rosters.

### 7. Bauhaus Neo-Brutalist Visual Design
- Bold 4px high-contrast borders, solid drop shadows (`8px 8px 0px #000`), vibrant primary accents (Crimson, Cobalt, Canary, Emerald), dark mode toggle, and custom modal dialogs (`UIModal.tsx`) with **zero native browser `alert()` popups**.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20.x or higher
- **PostgreSQL** v15+ (or Docker)
- **Python** 3.8+ (for automated test suite)

---

### Option A: Local Development Setup

#### 1. Start Database
```bash
docker compose up db -d
```

#### 2. Start Backend Server
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build
node dist/index.js
```
*Backend runs on `http://localhost:4000` (API: `http://localhost:4000/api`)*

#### 3. Start Frontend Development Server (New Terminal)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

### Option B: Full Docker Deployment
```bash
docker compose up --build -d
```

---

## 🧪 Dogfood 2026 T1–T4 Acceptance Suite

Run the automated verification suite:
```bash
python run.py
```

### Verified Test Results (`docs/acceptance-report.txt`):
| Tier | Check | Name | Result |
| :--- | :--- | :--- | :--- |
| **T1** | Check 1 | Role-Based Authentication & Token Validation | **PASS** (100%) |
| **T1** | Check 2 | Event Lifecycle & 5-Step Timeline with +1 Hour Extension | **PASS** (100%) |
| **T1** | Check 3 | Team Formation & Project Submissions | **PASS** (100%) |
| **T2** | Check 4 | Scoring Rubrics & Multi-Factor Evaluation (100% Weight) | **PASS** (100%) |
| **T2** | Check 5 | Strict Role Isolation (Peer Judge Access Blocked - 403) | **PASS** (100%) |
| **T2** | Check 6 | Offline Reset Passkey Generation (15-min TTL) | **PASS** (100%) |
| **T2** | Check 7 | Session Management & Authentication Integrity | **PASS** (100%) |
| **T3** | Check 8 | Community Project Voting & 1-Vote Constraint | **PASS** (100%) |
| **T3** | Check 9 | Certificate Studio & SHA-256 Hash Verification + Toggle Safety | **PASS** (100%) |
| **T4** | Check 10 | Full Atomic Database JSON Backup & Restore | **PASS** (100%) |

---

## 📁 Technical Specifications & Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Relational Data Model](docs/DATA-MODEL.md)
- [Adaptive Dynamic Judging & Score Normalization](docs/JUDGING.md)
- [Threat Model & Security Mitigations](docs/THREAT-MODEL.md)
- [Mathematical Normalization Proof](docs/NORMALIZATION-PROOF.md)
- [REST API OpenAPI 3.0 Specification](openapi.yaml)
- [Dogfood Specification Descriptor](.dogfood.toml)
- [Acceptance Test Suite Verification Report](docs/acceptance-report.txt)
