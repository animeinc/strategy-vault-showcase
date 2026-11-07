# Artifact 04: Real Backtest Case Studies & Cross-Window Conflicts

> **Desensitized Research Reports** extracted from `<vault_root>/03-研究/风险仓/2026-10-20-formal-downside-beta/REPORT.md` and `<vault_root>/03-研究/核心与仓间/2026-10-15-formal-ratio-v2/REPORT.md`.

---

## Case Study 1: S&P 500 Downside-Beta Penalized Momentum (`2026-10-20-formal-downside-beta`)

### Hypothesis & Rule Specification
- **Mechanism**: Pure 126-day price momentum (`R_126`) often picks high-beta stocks that suffer severe crashes during market reversals. We tested ranking S&P 500 constituents by penalizing downside beta:
  $$\text{Score}_i = \frac{R_{i,126}}{1 + \max(\beta_{i,\text{down}}, 0)}$$
  where $\beta_{i,\text{down}}$ is computed on negative market return days over the trailing 126 trading days (top 5 stocks, `<= 2` per SIC two-digit industry, 6 staggered tranches, `15 bps` one-way transaction cost).
- **Pre-Registration & Isolation**: Screened by Session `G3-1019a`; formal holdout verification executed in an isolated session (`G2-1020g`) with `study.json` SHA-256 locked prior to loading post-2011 data.

### Cross-Window Results (Why Single-Window Backtests Lie)

| Evaluation Window / Account Mode | Baseline CAGR | Candidate CAGR | Baseline Daily MaxDD | Candidate Daily MaxDD | Baseline Calmar | Candidate Calmar | Window Verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| **Step 0: Dev Screening (1997–2011, 4-Sleeve)** | 8.89% | **9.85%** | -47.33% | **-44.34%** | 0.188 | **0.222** | **PASS (Path B: +18.2% Calmar)** |
| **Pre-Sample M1 (1934–1985 CRSP, Risk Sleeve)** | 15.07% | **16.36%** | -68.00% | **-66.48%** | 0.222 | **0.246** | **PASS (Directional)** |
| **Out-of-Sample Holdout (2012–2025, 4-Sleeve)** | **17.74%** | 15.59% | **-28.18%** | -29.16% | **0.629** | 0.535 | **FAIL (-2.15pp CAGR, p = 0.0000)** |
| **Holdout Half 1 (2012–2018, Risk Sleeve)** | **19.14%** | 13.98% | -21.97% | **-16.65%** | **0.871** | 0.839 | **FAIL (-5.16pp CAGR)** |
| **Holdout Half 2 (2019–2025, Risk Sleeve)** | **23.23%** | 13.43% | **-28.18%** | -32.82% | **0.825** | 0.409 | **FAIL (-9.80pp CAGR)** |

### Engineering Diagnosis
- In `1997–2011` (which contained both the 2000–2002 dot-com crash and the 2008 GFC) and `1934–1985`, penalizing downside beta acted as a defensive brake.
- In `2012–2025`, US equity leadership was dominated by high-beta semiconductor and mega-cap growth stocks (which exhibited high volatility on market down-days but massive positive drift). Downside-beta penalization systematically filtered out the strongest winners, causing a **-9.80 percentage point annualized lag** during `2019–2025`.
- **Final Decision**: **Rejected (`不胜出`)**. Holdout wear counter incremented (`+1`). Baseline left unchanged.

---

## Case Study 2: Sleeve Allocation Shift `V2 40/40/10/10` (`2026-10-15-formal-ratio-v2`)

### Hypothesis & Rule Specification
- Tested shifting the account sleeve target weights from `30% Risk / 20% QLD / 40% Core / 10% Cash Reserve` to **`40% Risk / 40% QLD / 10% Core / 10% Cash Reserve`** (`V2`, 6-tranche execution, trimming Risk sleeve back to 40% only when exceeding a 44% drift band).

### Cross-Window Results

| Evaluation Window / Stress Scenario | Baseline CAGR | Candidate V2 CAGR | Baseline Daily MaxDD | Candidate V2 Daily MaxDD | Baseline Calmar | Candidate V2 Calmar | Gate Verdict |
|---|---:|---:|---:|---:|---:|---:|---|
| **Dev Screening (1997–2011, 6-Tranche)** | 8.18% | **9.33%** | -48.51% | **-45.44%** | 0.169 | **0.205** | **PASS (Path A)** |
| **Out-of-Sample Holdout (2012–2026)** | 21.30% | **24.96%** | -23.31% | -24.86% | 0.914 | **1.004** | **PASS Window (+3.66pp)** |
| **Holdout + 5%/yr Survivorship Haircut** | 19.31% | **22.06%** | -24.16% | -26.75% | 0.799 | **0.825** | **PASS Haircut** |
| **Block Bootstrap (2,000 runs, 252d block)** | — | `p = 0.6200` | — | — | — | — | **FAIL (`p = 0.620 < 0.70`)** |
| **Pre-Sample M1 (1934–1985 S&P Proxy)** | 6.67% | 7.67% | -55.98% | **-57.04%** | 0.119 | 0.135 | **ELIMINATED (`MaxDD > 55%`)** |

### Engineering Diagnosis
- While `V2 (40/40/10/10)` outperformed in both `1997–2011` and `2012–2026` (+3.66 pp/yr out-of-sample CAGR), doubling the 2x leveraged `QLD` sleeve from 20% to 40% pushed the `1934–1985` M1 maximum drawdown to **`-57.04%`** (breaching the `-55%` hard elimination gate during the `1937–1942` contraction) and yielded only a `62.0%` block-bootstrap win probability (below the `70.0%` formal threshold).
- **Final Decision**: **Rejected (`不可采纳`)**. Demonstrates why an out-of-sample backtest win over a 14-year bull market (`2012–2026`) is insufficient without bootstrap significance and multi-decade crash stress testing.
