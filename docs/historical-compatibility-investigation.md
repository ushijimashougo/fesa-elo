# Historical compatibility investigation

## Purpose

This document records evidence used to decide whether `fesa-elo` can continue historical FESA rating operation with sufficient compatibility.

The goal is not to reproduce a Nekomado public result sheet cosmetically. The goal is to determine:

1. whether the current implementation reproduces historical FESA behavior from the same input state,
2. whether observed differences are explainable by missing historical events or source-ledger corrections,
3. whether any remaining differences are small enough to treat as rounding/implementation tolerance,
4. whether a historical state can be carried forward into current operation with an auditable basis.

## Evidence hierarchy

For historical compatibility work, use the following evidence in descending strength:

1. published FESA specification,
2. `kota/elo_rating` implementation at a known commit,
3. archived `ratingliste.pre`, tournament input, and `ratingliste.post`,
4. public tournament/result ledgers such as the Nekomado result list,
5. reconstructed or inferred data.

A discrepancy must not be silently normalized. Record which evidence is authoritative for the specific question.

## Why the legacy execution archives matter

The `kota/elo_rating` repository contains archived production-like execution artifacts. In particular:

- `turnering.txt` records tournament pairings/results,
- `ratingliste.pre` records the complete state before a tournament,
- `ratingliste.post` records the complete state after that tournament.

These artifacts are more useful than a visible rating number alone because the legacy algorithm is stateful. The state includes:

- rating,
- rated game count,
- performance-rating history for provisional players,
- bonus progress,
- grade-related state.

For compatibility investigation, a pre/input/post triplet is effectively an executable historical test vector.

The archive should therefore be treated as historical evidence, not as disposable log output.

## Preservation policy

Do **not** mirror the complete `kota/elo_rating` archive into this repository by default.

Instead:

- keep the upstream repository and exact commit SHA as the provenance source,
- preserve only the minimum normalized fixture required for automated compatibility tests,
- record the exact upstream file paths used,
- record derived conclusions in this document,
- copy substantial legacy source or bulk archives only after confirming redistribution/licensing implications.

This gives us reproducibility without turning `fesa-elo` into a duplicate archive repository.

If the upstream repository is ever at risk of disappearing, create a separate archival mirror rather than embedding the entire historical archive into the library source tree.

## 2018 R135 investigation

### Initial observation

The Nekomado public result history for R135 contained large replay corrections:

| Date | Current replay | Public ledger | Difference |
| --- | ---: | ---: | ---: |
| 2018-06-16 | 1432* | 1435* | +3 |
| 2018-07-21 | 1534 | 1625 | +91 |
| 2018-08-18 | 1588 | 1621 | +33 |

The July difference was too large to classify as rounding tolerance.

### Prior-grade synthetic games

The legacy implementation creates two synthetic games for a recognized prior grade:

- one win,
- one loss,

against the grade midpoint.

The legacy `turnering.lisp` counts these games in the stored provisional game history and therefore in the U-player thresholds.

The published FESA specification also explicitly states that the two games added because of a prior grade count toward both the 9-game and 18-game limits.

Conclusion:

> Treating the two prior-grade games as counting toward the FESA provisional thresholds is not a discovered legacy bug. It is consistent with both the legacy implementation and the published FESA rule.

### Critical missing event: 2018-05-26 company league

The strongest discovery was that R135 did not play only Nekomado events.

Source:

- repository: `kota/elo_rating`
- commit used for reconstruction: `c7adb145e1b98ce91458e4e50bdbbedc8059f771`
- archive: `archives/3rd_company_league_day1`
- date: 2018-05-26

The archive contains a complete pre/input/post chain.

For R135:

- after the 2018-05-19 Nekomado event: rating 1496, 5 rated games including the two prior-grade synthetic games,
- on 2018-05-26: three company-league games, all losses,
- after the company league: rating 1441, 8 rated games.

The three opponents recorded by the archived tournament are R64, R97, and R143.

The archived post-state for R135 contains opponent final ratings 2207, 1848, and 1636 for these three losses.

This proves that a Nekomado-only replay was missing real FESA-rated history.

### Consequence for the June/July interpretation

A Nekomado-only sequence appears as:

- May: 3 actual games,
- June: 6 actual games,
- July: 9 actual games.

That made the Nekomado public ledger's star transition look as though July were the first established tournament.

The full FESA history is different:

- 2018-05-19: 5 counted games including prior-grade games,
- 2018-05-26 company league: 8 counted games,
- 2018-06-16 Nekomado: the next three games take the player beyond the provisional threshold.

Therefore the Nekomado public result ledger cannot be assumed to be a direct serialization of the complete shared FESA state.

At minimum, it omitted an external FESA-rated event when viewed as a standalone history.

### What this explains and what it does not

Confirmed:

- the original Nekomado-only migration fixture was incomplete as a complete FESA history,
- R135's 2018 state entering the June Nekomado event was not simply the May Nekomado post-state,
- a large replay discrepancy must not be attributed to formula error until all FESA-rated events are reconstructed.

Not yet proven:

- whether the Nekomado public ledger intentionally maintained a local-only provisional counter,
- whether the July 1625 value was produced by a local performance-rating convention,
- whether any remaining July/August discrepancy persists after the external FESA event is inserted and replayed from the archived pre-state.

Those remain hypotheses until the full replay result is compared.

## Compatibility test introduced in table-hub-app

The migration/audit repository now preserves the 2018-05-26 external FESA event separately from Nekomado tournament UI data.

Normalized fixture:

- `table-hub-app/tests/fixtures/fesa/external-events.json`

The fixture was reconstructed from the legacy archive and contains:

- 58 rated participants,
- 74 rated games,
- archived pre-state,
- archived post-state,
- source provenance.

The replay distinguishes two different discrepancies:

### 1. Historical-input discontinuity

Compare the state produced by the currently reconstructed preceding history with the archived `ratingliste.pre`.

If they differ, the cause is historical state/input incompleteness, not necessarily a rating formula incompatibility.

### 2. Calculation compatibility discrepancy

Reset to the archived pre-state, run the same tournament through `fesa-elo`, and compare with archived `ratingliste.post`.

If they differ, the discrepancy is attributable to algorithm compatibility, state translation, rounding, or another implementation detail under the same input.

This distinction is essential for deciding whether `fesa-elo` is trustworthy as a continuation implementation.

## Tolerance policy

Do not define a broad acceptable error such as “within a few rating points” for historical compatibility.

Use the following interpretation:

- exact match: preferred,
- ±1: may be acceptable only when the cause is demonstrated to be rounding/order semantics,
- >1: investigate and explain,
- large discontinuities: never classify as acceptable numerical tolerance without a specific cause.

A final migration may still carry an authoritative historical end rating forward after an audited correction, but the correction must retain:

- calculated value,
- source value,
- difference,
- source provenance,
- reason/classification.

## Current conclusion

The historical evidence supports using `fesa-elo` as a continuation candidate, but trust must come from replay evidence rather than from formula similarity alone.

The R135 investigation demonstrated why:

- a +91 difference initially looked like a rating-algorithm problem,
- archived execution data revealed a missing FESA-rated tournament,
- the archived pre/post state makes it possible to separate missing-history errors from actual implementation incompatibility.

The legacy execution archives are therefore a core part of the compatibility evidence base.

They should be preserved upstream (or in a dedicated archival mirror if necessary), while this repository should retain normalized golden fixtures and explicit provenance.

## 2026 Nekomado forward-compatibility validation

The historical 2018 investigation is not used as the acceptance criterion for future operation.

A dedicated forward-compatibility test was added using the 2026 Nekomado tournament data. The test gives the same normalized starting state and the same tournament results to:

- the pinned legacy `kota/elo_rating` Common Lisp implementation,
- the current `fesa-elo` TypeScript implementation.

Pinned inputs:

- Nekomado fixture provenance: `ushijimashougo/table-hub-app@89cd3905ec0cc1181a00360d1319b1ba88545`
- legacy implementation: `kota/elo_rating@c7adb145e1b98ce91458e4e50bdbbedc8059f771`
- normalized fixture: `tests/compatibility/fixtures/nekomado-2026.json`
- runner: `scripts/compatibility/nekomado-2026-legacy.mjs`
- workflow: `.github/workflows/nekomado-2026-legacy-compatibility.yml`

For established players, the starting state intentionally matches the current Table Hub migration baseline:

- `ratedGames = 9`
- `bonusGamesUsed = 100`

For provisional players, the test starts from the inferred prior grade and zero rated games, matching the migration model.

The comparison checks, for every player after every tournament:

- rating,
- rated game count,
- bonus-game count,
- provisional/established state.

### Result

GitHub Actions run `33902800157` completed successfully.

| Tournament | Participants | Rated games | Differences |
| --- | ---: | ---: | ---: |
| 2026-01 | 18 | 27 | 0 |
| 2026-02 | 18 | 25 | 0 |
| 2026-03 | 21 | 30 | 0 |
| 2026-04 | 10 | 15 | 0 |
| 2026-05 | 14 | 20 | 0 |
| 2026-06 | 15 | 21 | 0 |
| 2026-07 | 15 | 21 | 0 |
| 2026-08 | 16 | 24 | 0 |

**All eight tournaments matched exactly.**

This is the primary compatibility evidence for forward operation: from the current normalized migration state, the TypeScript implementation produces the same tournament state transitions as the pinned legacy implementation for the complete available 2026 Nekomado sequence.

This result does not resolve unexplained historical ledger differences in 2018. It demonstrates that those historical discrepancies are not evidence of a current forward-calculation incompatibility under the tested migration state.
