# NORMALIZATION-PROOF.md — Adaptive Scale-Aware Normalization Proof & Verification

This document presents the mathematical proof and verification for the **Adaptive Scale-Aware Score Normalization Engine** implemented in `backend/src/routes/organizer.routes.ts` (`GET /api/organizer/events/:id/normalization-proof`).

---

## 1. Scale-Aware Dynamic Consensus Proof ($K$ Selection)

The platform dynamically calculates consensus depth $K$ using:
$$K = \text{clamp}\left( \left\lfloor \frac{J \cdot W_{\text{max}}}{S} \right\rfloor, 1, \min(3, J) \right)$$

### Verification across Scales:
- **Scenario A ($S=15, J=5$)**: $K = \lfloor (5 \cdot 25) / 15 \rfloor = \lfloor 8.33 \rfloor = 8 \implies$ Capped at $\min(3, 5) = \mathbf{3}$ judges/project.
- **Scenario B ($S=200, J=10$)**: $K = \lfloor (10 \cdot 25) / 200 \rfloor = \lfloor 1.25 \rfloor = \mathbf{1}$ judge/project (workload = 20 projects/judge).
- **Scenario C ($S=500, J=25$)**: $K = \lfloor (25 \cdot 25) / 500 \rfloor = \lfloor 1.25 \rfloor = \mathbf{1}$ judge/project.

---

## 2. Multi-Judge Score Normalization Proof

Consider 2 projects evaluated under Scenario A ($K=2$ judges per project) across 3 judges with distinct strictness profiles:

| Project | Assigned Judges | Raw Scores ($R_{i,j}$) | Judge Profiles ($\mu_j, \sigma_j$) |
|---|---|---|---|
| **Project Alpha** | Judge A (Strict), Judge B (Lenient) | $R_{\alpha,A} = 6.4$, $R_{\alpha,B} = 8.8$ | $\mu_A = 5.6, \sigma_A = 0.8$<br>$\mu_B = 8.5, \sigma_B = 0.6$ |
| **Project Beta** | Judge A (Strict), Judge C (Moderate) | $R_{\beta,A} = 4.8$, $R_{\beta,C} = 7.0$ | $\mu_A = 5.6, \sigma_A = 0.8$<br>$\mu_C = 7.0, \sigma_C = 1.0$ |

---

## 3. Mathematical Execution

Z-Score formula:
$$z_{i,j} = \frac{R_{i,j} - \mu_j}{\sigma_j} \implies S_{i,j} = \text{clamp}\left((z_{i,j} \cdot 15) + 65, 0, 100\right)$$

Consensus score:
$$\text{Final Score}_i = \frac{1}{K_i} \sum_{j=1}^{K_i} S_{i,j}$$

### Project Alpha Calculations:
1. **Judge A** ($R=6.4$): $z = \frac{6.4 - 5.6}{0.8} = +1.00 \implies S_{\alpha,A} = (1.00 \cdot 15) + 65 = 80.00$
2. **Judge B** ($R=8.8$): $z = \frac{8.8 - 8.5}{0.6} = +0.50 \implies S_{\alpha,B} = (0.50 \cdot 15) + 65 = 72.50$
3. **Consensus Final Score**: $\text{Final Score}_{\alpha} = \frac{80.00 + 72.50}{2} = \mathbf{76.25}$

### Project Beta Calculations:
1. **Judge A** ($R=4.8$): $z = \frac{4.8 - 5.6}{0.8} = -1.00 \implies S_{\beta,A} = (-1.00 \cdot 15) + 65 = 50.00$
2. **Judge C** ($R=7.0$): $z = \frac{7.0 - 7.0}{1.0} = 0.00 \implies S_{\beta,C} = (0.00 \cdot 15) + 65 = 65.00$
3. **Consensus Final Score**: $\text{Final Score}_{\beta} = \frac{50.00 + 65.00}{2} = \mathbf{57.50}$

---

## 4. Leaderboard Proof Summary Table

| Rank | Project | Assigned Judges | Avg Raw Score | Individual Normalized Scores ($S_{i,j}$) | Final Consensus Score |
|---|---|---|---|---|---|
| **#1** | **Project Alpha** | Judge A, Judge B | 7.60 | [80.00, 72.50] | **76.25** |
| **#2** | **Project Beta** | Judge A, Judge C | 5.90 | [50.00, 65.00] | **57.50** |

---

## 5. Live Endpoint Verification

Organizers can query:
```http
GET /api/organizer/events/:eventId/normalization-proof
```
The endpoint dynamically computes scale statistics, per-judge statistics ($\mu_j, \sigma_j$), individual $Z$-scores, and final consensus rankings.
