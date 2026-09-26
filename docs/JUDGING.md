# JUDGING.md — Adaptive Dynamic Multi-Judge Assignment & Score Normalization Engine

This document details the production-grade **Adaptive Dynamic Multi-Judge Assignment Algorithm** and **Cross-Judge Score Normalization Engine**. The system dynamically computes the optimal number of judges per project ($K$) based on global event scale (number of submissions $S$ vs. available judges $J$), while strictly managing human judge workload capacity.

---

## 1. Scale-Aware Adaptive Assignment Logic

In large-scale production hackathons (e.g. 1,000+ submissions and 10 judges), statically hardcoding 3 judges per project would result in an impossible workload of 300 projects per judge. 

The platform uses an **Adaptive Dynamic Assignment Formula** that automatically calculates the optimal consensus depth $K$:

$$K_{\text{optimal}} = \text{clamp}\left( \left\lfloor \frac{J \cdot W_{\text{max}}}{S} \right\rfloor, 1, \min(3, J) \right)$$

where:
- $J$ = Total available judges
- $S$ = Total submitted projects
- $W_{\text{max}} = 25$ = Maximum human evaluation capacity per judge

---

## 2. Dynamic Assignment Cases & Scale Matrix

| Scale Scenario | Submissions ($S$) | Judges ($J$) | Calculated $K$ (Judges/Project) | Total Assignments | Avg Workload per Judge | Operational Strategy |
|---|---|---|---|---|---|---|
| **Small Local Event** | 20 | 8 | **3** | 60 | 7.5 projects | Maximum consensus depth ($K=3$) |
| **Medium Hackathon** | 100 | 10 | **2** | 200 | 20.0 projects | Dual-judge consensus ($K=2$) |
| **Mega Hackathon (Large Scale)** | 1000 | 10 | **1** | 1,000 | 100.0 projects | Single-judge model ($K=1$) + Z-Score normalization |
| **Judge Surplus** | 10 | 15 | **3** | 30 | 2.0 projects | Capped at $K=3$ max to avoid redundant grading |

---

## 3. Strict Non-Duplication & Workload Balancing Constraints

The assignment algorithm guarantees 3 mathematical invariants:
1. **Zero Self-Duplication**: For any project $s_i$, assigned judges $\{j_1, j_2, \dots, j_K\}$ are strictly distinct ($j_m \neq j_n$). No judge receives the same project twice.
2. **Workload Minimization**: Candidate judges are sorted by current assigned workload ascending, ensuring an even distribution across all judges.
3. **Fisher-Yates Randomization**: Projects are shuffled prior to assignment to randomize allocation and remove ordering bias.

---

## 4. Cross-Judge Normalization & Score Aggregation

### 4.1 Z-Score Normalization
For judge $j$ with mean $\mu_j$ and standard deviation $\sigma_j$:
$$z_{i,j} = \frac{R_{i,j} - \mu_j}{\sigma_j}$$

Rescaled score $S_{i,j}$ (Target $\mu=65, \sigma=15$):
$$S_{i,j} = \text{clamp}\left( (z_{i,j} \cdot 15) + 65, 0, 100 \right)$$

### 4.2 Multi-Judge Score Aggregation
For project $i$ evaluated by $K_i$ distinct judges ($1 \le K_i \le 3$), the final normalized score is the mean across all evaluating judges:
$$\text{Final Normalized Score}_i = \frac{1}{K_i} \sum_{j=1}^{K_i} S_{i,j}$$

### 4.3 Fallback Rules
- **Zero Variance ($\sigma_j = 0$)**: Uses global mean offset $S_{i,j} = \text{clamp}\left((R_{i,j} + (65 - \mu_j)) \cdot 10, 0, 100\right)$.
- **Tiebreakers**: Higher Consensus Final Score $\to$ Higher Average Raw Score $\to$ Earlier submission timestamp.
