# Threat Model & Security Architecture

## 1. Security Principles
HackNext is designed around zero-trust air-gapped assumptions:
1. **Container Isolation & Host Privilege**: Administrative bootstrap occurs strictly via CLI (`setup:master`) or authorized admin token. No insecure `/setup` web routes exist.
2. **Offline Self-Sufficiency**: No telemetry, no third-party CDN scripts, no OAuth SaaS dependencies. All cryptographic verifications execute locally.

---

## 2. Threat Analysis & Mitigations

### 2.1 Sybil & Ballot Stuffing (Community Voting)
- **Threat**: Bad actors create multiple accounts or write bots to manipulate project voting rankings.
- **Mitigation**:
  - Community voting is restricted strictly to authenticated participants.
  - Unique composite constraint in database: `@@unique([event_id, user_id])` guarantees exactly 1 vote per user per event.
  - Users are forbidden from voting for their own team's submission.
  - Public gallery displays strictly project title and description (no external links or code execution vectors).

### 2.2 Peer Judge Collusion & Information Leakage
- **Threat**: A judge alters grading behavior upon seeing other judges' evaluations or colludes with specific participants.
- **Mitigation**:
  - Strict Role Isolation: Routes `/api/judge/scores/peer` and parameterized queries (`?judge=...`) strictly check requesting judge ID and return `HTTP 403 Forbidden` if peer access is attempted.
  - Blind Evaluation: Raw scores from other judges are hidden until results are officially published.
  - Statistical Z-Score Normalization neutralizes outlier manipulation.

### 2.3 Deadline Gaming & Submission Tampering
- **Threat**: Participants attempt to alter submissions after the official submission deadline has passed.
- **Mitigation**:
  - Backend verifies event deadline timestamp on every submission modification request.
  - Once the `Project Submission` phase closes, project edits return `HTTP 400 Submission Window Closed`.
  - Organizers retain sole authority to extend deadlines via controlled `+1 Hour` extension endpoints.

### 2.4 Certificate Forgery & Impersonation
- **Threat**: Dishonest participants edit SVG / PDF certificates to falsify award rankings.
- **Mitigation**:
  - Every certificate generated embeds a cryptographic SHA-256 integrity hash calculated over `(certificate_no + recipient_name + event_id + template_title + issue_timestamp)`.
  - Public verification at `/verify/certificate/:id` dynamically recomputes the SHA-256 hash and validates against database records.
  - Certificates are generated and stored strictly on the local filesystem (`uploads/certificates/`).

### 2.5 Session Hijacking & Concurrent Logins
- **Threat**: Stolen token used concurrently across devices.
- **Mitigation**:
  - Each user record maintains a `session_version` counter.
  - Upon a new login, the session version increments, instantly invalidating previous JWT tokens with `HTTP 401 SESSION_INVALIDATED`.

### 2.6 Offline Password Reset Tampering
- **Threat**: Unauthorized password reset requests.
- **Mitigation**:
  - Reset requests require physical organizer approval in the Ops console.
  - Passkeys are cryptographically random 8-character codes with strict 15-minute TTL.
