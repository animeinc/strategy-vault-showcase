# Artifact 03: Explicit Error Tolerances & Anti-Overfitting Gate Specification

> **Desensitized Engineering Excerpt** from `<vault_root>/_组长/决定.md` (Decision 39 & Decision 53), `<vault_root>/_组长/目标函数.md`, and `<vault_root>/_组长/评估/评分标准.v4.md`.

## 1. Explicit Error Tolerances (Stopping Infinite Agent Rerun Loops)

Before introducing explicit tolerances, multi-agent review sessions repeatedly rejected and re-ran full backtests over insignificant floating-point differences (`1e-7` drift across OS/Python builds or `$0.01` rounding discrepancies on reference fee tables).

**Decision 39 & Gate G3 Tolerance Policy:**
- **Strategy-Level Metrics (`CAGR`, `Daily MaxDD`, `Calmar`)**: Explicit tolerance of **`±0.05` percentage points (`0.0005`)** when reproduced by the Leader Agent on an isolated portable path (`inspect.py --run --portable`).
- **Reference Transaction Cost & Ledger Rounding**: Single-row rounding differences **`<= $0.01`** and full-batch absolute sum differences **`<= $0.05`** are **logged as an audit note and halted** — agents are prohibited from opening rework tasks or re-running backtests if trade direction, constituent selection, integer share rounding, and gate verdicts remain unchanged.
- **Metric floats (Decision 39)**: relative error `<= 1e-6`, provided trade direction, constituents, share rounding, cash attribution and gate verdicts are unchanged.
- **Deterministic Numerical Arrays & Prefix Invariance (task-card contracts, stricter than Decision 39)**: Verified via `numpy.isclose(..., rtol=1e-9, atol=1e-12)`. Future data perturbation past a cutoff date (`cut = 2004-06-30`) must yield **`max_abs_diff <= 1e-12`** on all pre-cutoff NAVs to guarantee zero lookahead leakage.
- **One-Pass Review Cap (`SESSION-RULES 3c`)**: Maximum **2 review rounds** for production signal code (`A-level`) and **1 review round** (`30 min` budget) for research conclusions (`B-level`). "Must-fix" items are strictly limited to defects that flip a live signal/amount or break execution, and each must include a runnable counterexample fixture.

---

## 2. Objective Function & Overfitting Defense (`目标函数.md`)

All strategies are evaluated at the **account level, net of transaction costs (`15 bps` baseline, `30 bps` stress) and next-open execution lag (`delay1`)**:

### Hard Drawdown Constraints
- **Qualified**: Daily close MaxDD **`<= 50.0%`** (and in the `1997–2011` development window, no deeper than the baseline **`−48.51%` / `−50.20%`** gate).
- **Soft Zone (`50.0% < MaxDD <= 55.0%`)**: Only qualified if Calmar strictly exceeds the current production baseline.
- **Hard Elimination (`MaxDD > 55.0%`)**: Automatically eliminated regardless of CAGR.

### Winning Paths (vs. Identical-Window, Identical-Engine Baseline)
- **Path A (Return Expansion)**: `CAGR >= Baseline + 1.0 pp` AND `Calmar >= Baseline * 0.95`
- **Path B (Risk-Efficiency Expansion)**: `Calmar >= Baseline * 1.15` AND `CAGR >= Baseline - 1.0 pp`

### Six-Stage Overfitting Defense Funnel
1. **Development Screening (`1997–2011`)**: Maximum **3 fixed variants** per hypothesis. Results are labeled *"Screening Only — Not Adoptable."*Negative results receive equal evaluation credit (`奖惩.md`) so Worker Agents have zero incentive to p-hack or tweak parameters on the same sample.
2. **Crash-Year & Exposure-Matched Ablation**: Candidates must not trail the exposure-matched baseline (`k * Baseline + (1 - k) * Cash`) when the `2000–2002` dot-com bust and `2008` GFC years are removed.
3. **Pre-Sample Historical & Cross-Market Confirmation**: Tested on **`M1 (1934–1985 CRSP/S&P)`** and international index proxies (`Nikkei 225`, `DAX`, `FTSE 100`, `Hang Seng` prior to 2011) before touching the holdout set.
4. **Out-of-Sample Holdout Wear Formula (`Decision 53`)**:
   Every formal test on the `2012–2026` holdout window increments the cumulative wear counter $N$. To correct for multiple-testing inflation across time, the required block-bootstrap win probability ($2,000$ resamples, $252$-day blocks) scales as:
   $$p_{\text{threshold}}(N) = 1 - \frac{0.30}{N}$$
   - At $N = 1$: $p \ge 0.70$
   - At current vault state (6 formal tests run; next $N = 7$): **$p \ge 0.957$**
   - Candidates achieving $0.70 \le p < 0.957$ are classified as *"Preliminary Pass"* and must survive a **12-month forward shadow ledger** before adoption.
5. **Survivorship Haircut**: Risk-sleeve candidates must still pass after an explicit **`5.0%/year` (`0.95^(1/252)` daily)** survivorship penalty when tested on non-CRSP panels.
