# Artifact 01: Leader-to-Worker Task Contract (`20261107-1024-02`)

> **Desensitized Engineering Artifact** extracted from `<vault_root>/_协作/任务/20261107-1024-02-qld-ndx-vardrain-arb-dev.md` (translated from internal Chinese spec to English; local paths normalized).
> Every task card is constrained to `<= 4,500 UTF-8 bytes` and checked by `scoring_gate.py predispatch_gate()` before a Worker Agent can claim it.

```markdown
# High-Volatility 2x Leveraged ETF Variance-Drain Delta-Hedged Harvesting (1997–2011 Dev Screening)
- Type: Research
- Priority: P1
- Assigned Slot: Worker Pool (G5)
- Author: Leader-GM
- Inputs: _leader/fixtures/dispatch-GM1002/SPEC-G5-vardrain.md; _leader/fixtures/dispatch-GM1002/source-audit.json
- Output Dir: 03-research/QLD/2026-11-07-qld-ndx-vardrain-arb-dev/
- Completion Criteria: Deliver S1/S2/S0/RULE_B/k*B/BH_QLD/CASH evaluations, results/trials.csv, check.py, and DELIVERY.json per SPEC.

- Work Contract: v1
- Delivery Gate: v1
- Model Fit Cap: 0
- Fit Definition: Uses Avellaneda-Zhang (2010) theoretical 2:1 leverage ratio, prior RV20 >= 0.28 threshold, and 5-day rebalance cadence; zero statistical parameter fitting (fit=0).
- Runtime Manifest: _leader/fixtures/dispatch-GM1002/runtime.json
- Single Verifiable Objective: Test over 1997-01-02..2011-12-30 (3,776 evaluation days, 1996 warmup) with fit=0 whether shorting QLD and delta-hedging long 2x NDX during high-volatility regimes (RV20 >= 0.28) beats RULE_B, exposure-matched k*B, S0, and CASH after 15bp/30bp turnover costs and 100bp/yr borrow fees.
- Authorized Write Scope: 03-research/QLD/2026-11-07-qld-ndx-vardrain-arb-dev/ (all other paths read-only)
- Stop Condition: Release immediately with minimal evidence if source SHA mismatches, if post-2012 data is read, if 2:1 ratio or RV20>=0.28 threshold is altered, or if fit > 0.
- Truncated Read Rule: String-level filter retaining 1996-01-02 <= date <= 2011-12-30 on qld_panel_through_2011.csv and cash_daily.csv; strictly forbidden from reading 2012+ holdout data.
- Code Reuse Source: _collab/svkit.py@25a720b7
- New Code Budget: run_study.py <= 360 lines, check.py <= 300 lines
- Fixed Compute Budget: fit=0; paths <= 30; block_len=63, n_boot=20000, seed=20261129; regular files <= 18
- Criterion: P1 | check.py --fixture _leader/fixtures/dispatch-GM1002/g5-pos.json | Verify rv20_ann=0.7575366405435182 triggers gate_vd=1, h_target=0.25, and 2xNDX-QLD gross spread returns rc=0; tolerance rtol=1e-9, atol=1e-12
- Criterion: N1 | check.py --fixture _leader/fixtures/dispatch-GM1002/g5-neg.json | Catch lookahead violation (signal_lag_days=0) or low-vol entry (RV20 < 0.28) and reject with rc=2
- Criterion: P2 | Verify 2008-10-15 anchor & prefix invariance (cut=2004-06-30) | r_u=-0.09052489965812516, r_qld=-0.1627218998486214, rate_prev=0.0427 match (rtol=1e-9, atol=1e-12); prefix diff <= 2004-06-30 is <= 1e-12
- Criterion: P3 | check.py independently recomputes all CSVs, results/trials.csv, REPORT.md, and DELIVERY.json | Matches within rtol=1e-9, atol=1e-12; CASH Calmar=NA; fit_count=0; returns rc=0
- Leader Fixtures: pos=_leader/fixtures/dispatch-GM1002/g5-pos.json -> rc=0; neg=_leader/fixtures/dispatch-GM1002/g5-neg.json -> rc=2
```
