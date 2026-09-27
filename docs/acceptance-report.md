# HackNext Acceptance Test Report
Generated: 2026-09-27 19:32:46 UTC
Overall Status: 6/10 Passed

## Summary of Claims
- Claimed Tiers: T1 (Core), T2 (Judging & Security), T3 (Public & Certificates), T4 (Portability)
- Offline Ready: YES (0 external CDNs, fonts, or third-party APIs)

## Tier Breakdown

### T1 - PASSED (3/3 Checks Passed)
- [✓] Check 1: Role-Based Authentication & Token Validation
    * Details: Organizer, Participant, Judge registered and verified
- [✓] Check 2: Event Lifecycle & 5-Step Timeline with +1 Hour Extension
    * Details: Phases: Registration, Project Submission, Evaluation, Community Voting, Result Out
- [✓] Check 3: Team Formation & Project Submissions
    * Details: Team: f37b18d4-dec4-4ec5-aa6e-1ba334cf29b8, Sub: e4c0fde7-8a8c-468a-81b6-313276d1eecc

### T2 - PARTIAL (3/4 Checks Passed)
- [✗] Check 4: Scoring Rubrics & Multi-Factor Evaluation
    * Details: Rubric weight: 100% (Default 4 criteria)
- [✓] Check 5: Strict Role Isolation (Peer Judge Access Blocked)
    * Details: HTTP 403 Forbidden properly returned for peer scores
- [✓] Check 6: Offline Reset Passkey Generation (15m TTL)
    * Details: Generated Passkey: RST-69F3-3852
- [✓] Check 7: Session Management & Authentication Integrity
    * Details: Session issued and validated

### T3 - PARTIAL (0/2 Checks Passed)
- [✗] Check 8: Community Project Voting & 1-Vote Constraint
    * Details: Vote 1: 404, Vote 2 Rejected: 404, Gallery sanitized: False
- [✗] Check 9: Certificate Studio & Integrity Hash Verification
    * Details: Generated 0 vector certificates with SHA-256 integrity hashes

### T4 - PARTIAL (0/1 Checks Passed)
- [✗] Check 10: Full Atomic Database JSON Backup & Restore
    * Details: Tables snapshotted and restored: 5
