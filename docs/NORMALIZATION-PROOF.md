# NORMALIZATION-PROOF.md — Score Normalization Proof & Verification Suite

This document presents the formal mathematical proofs, edge case verifications, and audit formulas for the HackNext Evaluation Engine.

---

## 1. Mathematical Formulation

### Population Statistics per Judge $j$
For judge $j$ with assigned submissions $\{x_{1,j}, x_{2,j}, \dots, x_{N_j,j}\}$:
$$\mu_j = \frac{1}{N_j} \sum_{i=1}^{N_j} x_{i,j}$$
$$\sigma_j = \sqrt{\frac{1}{N_j} \sum_{i=1}^{N_j} (x_{i,j} - \mu_j)^2}$$

### Pure Z-Score Step
$$z_{i,j} = \begin{cases} \frac{x_{i,j} - \mu_j}{\sigma_j} & \text{if } \sigma_j > 0 \\ 0.0 & \text{if } \sigma_j = 0 \end{cases}$$

### Presentation Display Scaling (0–100)
$$S_{i,j} = \max\left(0, \min\left(100, 65 + 15 \cdot z_{i,j}\right)\right)$$

### Project Consensus Aggregate
For project $i$ evaluated by judge set $J_i$:
$$\bar{S}_i = \frac{1}{|J_i|} \sum_{j \in J_i} S_{i,j}$$

---

## 2. Step-by-Step Proof Examples

### Case 1: Standard Evaluation with Varying Strictness

Suppose Judge A (Strict) and Judge B (Lenient) evaluate 3 projects:

- **Judge A Raw Scores**: $[6.0, 7.0, 8.0]$
  - $\mu_A = \frac{6.0 + 7.0 + 8.0}{3} = 7.00$
  - $\text{Var}_A = \frac{(6-7)^2 + (7-7)^2 + (8-7)^2}{3} = \frac{2}{3} \approx 0.6667$
  - $\sigma_A = \sqrt{0.6667} \approx 0.8165$

- **Judge B Raw Scores**: $[8.0, 9.0, 10.0]$
  - $\mu_B = \frac{8.0 + 9.0 + 10.0}{3} = 9.00$
  - $\sigma_B = \sqrt{0.6667} \approx 0.8165$

#### Project 1 (Score 6.0 from Judge A, Score 8.0 from Judge B):
- Judge A: $z_{1,A} = \frac{6.0 - 7.0}{0.8165} = -1.2247 \implies S_{1,A} = \text{clamp}(65 + 15(-1.2247)) = 46.63$
- Judge B: $z_{1,B} = \frac{8.0 - 9.0}{0.8165} = -1.2247 \implies S_{1,B} = \text{clamp}(65 + 15(-1.2247)) = 46.63$
- **Final Consensus Score**: $\bar{S}_1 = \frac{46.63 + 46.63}{2} = 46.63$

#### Project 2 (Score 7.0 from Judge A, Score 9.0 from Judge B):
- Judge A: $z_{2,A} = \frac{7.0 - 7.0}{0.8165} = 0.000 \implies S_{2,A} = 65.00$
- Judge B: $z_{2,B} = \frac{9.0 - 9.0}{0.8165} = 0.000 \implies S_{2,B} = 65.00$
- **Final Consensus Score**: $\bar{S}_2 = \frac{65.00 + 65.00}{2} = 65.00$

#### Project 3 (Score 8.0 from Judge A, Score 10.0 from Judge B):
- Judge A: $z_{3,A} = \frac{8.0 - 7.0}{0.8165} = +1.2247 \implies S_{3,A} = \text{clamp}(65 + 15(1.2247)) = 83.37$
- Judge B: $z_{3,B} = \frac{10.0 - 9.0}{0.8165} = +1.2247 \implies S_{3,B} = \text{clamp}(65 + 15(1.2247)) = 83.37$
- **Final Consensus Score**: $\bar{S}_3 = \frac{83.37 + 83.37}{2} = 83.37$

---

### Case 2: Zero Variance Safety Verification ($\sigma = 0$)

Suppose Judge C awards identical scores of `8.5` to all assigned projects:
- $\mu_C = 8.50$
- $\sigma_C = 0.00$
- By zero-variance rule: $z_{i,C} = 0.000$
- Scaled score: $S_{i,C} = \text{clamp}(65 + 15(0.000)) = 65.00$

**Result**: Zero division errors are prevented, and the judge's score neither unfairly elevates nor penalizes the project relative to the baseline.

---

## 3. $K$ Feasibility Proof & Enforcement

Let $S$ be total projects, $J$ total judges, and $W_{\text{max}} = 25$ max projects per judge:

$$\text{Capacity } C = J \times 25$$
$$K_{\text{max}} = \min\left(J, \left\lfloor \frac{C}{S} \right\rfloor\right)$$

- **Scenario 1**: $S = 20, J = 4 \implies C = 100 \implies K_{\text{max}} = \min(4, \lfloor 100/20 \rfloor) = \min(4, 5) = 4$. If requested $K=2$, feasible $\implies K=2$.
- **Scenario 2**: $S = 60, J = 2 \implies C = 50 \implies K_{\text{max}} = \min(2, \lfloor 50/60 \rfloor) = 0$. Infeasible for any $K \ge 1$ without adding judges or increasing capacity.
- **Scenario 3**: $S = 50, J = 3 \implies C = 75 \implies K_{\text{max}} = \min(3, \lfloor 75/50 \rfloor) = 1$. If requested $K=2$, engine clamps $K$ to $1$ to guarantee no judge receives $> 25$ projects.
