# Calculation specification

This document defines the intended behavior of `fesa-elo`.

The normative source is the published FESA Elo specification:

- https://fesashogi.eu/elo-system/

The legacy implementation in `kota/elo_rating` is used to validate compatibility and to discover operational details that may not be obvious from the prose specification.

## 1. Calculation unit

Ratings are updated after each rated tournament.

The core library therefore calculates a **whole tournament at once** rather than exposing a stateful per-game mutation API.

This is required because the FESA algorithm uses the opponent's **post-tournament rating** when calculating a game. Final ratings are therefore mutually dependent and must be iterated until stable.

## 2. Basic Elo formula

For a player rating `pr` and opponent post-tournament rating `or`:

```
f(pr, or) = 1 / (1 + 10 ^ ((or - pr) / 400))
```

Normal rating change for one game:

```
k(pr) * (result - f(pr, or))
```

Where:

- win = `1`
- draw = `0.5`
- loss = `0`

The player's rating before each game is used. Within a tournament, rating changes from earlier games therefore affect the `pr` used for later games.

The total tournament change is accumulated with decimals and rounded only after the tournament total is known.

## 3. K factor

The published FESA table is:

| Rating before game | K |
| --- | ---: |
| 2240 or higher | 16 |
| 1920–2239 | 20 |
| 1560–1919 | 24 |
| 1280–1559 | 28 |
| 1040–1279 | 32 |
| 720–1039 | 36 |
| below 720 | 40 |

The K value is determined from the player's rating before that game, not simply from the pre-tournament rating.

## 4. Iterative tournament calculation

The opponent rating used for a game is the opponent's final rating after the same tournament.

Therefore:

1. calculate provisional tournament results,
2. use the newly calculated ratings as opponent final ratings,
3. calculate again,
4. repeat until values are stable.

The implementation must define an explicit convergence rule and a defensive maximum iteration count.

Compatibility tests should verify that the convergence behavior reproduces the legacy implementation for known fixtures.

## 5. Performance rating

Performance rating is used instead of the normal formula if any of the following is true:

- the current tournament is the player's first rated tournament,
- total rated games including the current tournament are fewer than 9,
- all results from prior tournaments are wins,
- all results from prior tournaments are losses.

When performance rating is used, **all applicable prior rated games plus the current tournament games** are included.

The performance rating is the value `x` for which:

```
g(x) = Σ(res(i) - f(x, or(i))) = 0
```

Where `or(i)` is the opponent's post-event rating for that historical game.

### All losses

If every included result is a loss, the resulting performance rating is `1`.

The player remains subject to performance-rating calculation in a later tournament.

### All wins

If every included result is a win, add one dummy draw against the highest-rated included opponent before solving the performance rating.

The dummy draw is a calculation device only. It is not persisted as a real game.

If the player remains all-win in the next tournament, performance rating is used again and a new dummy draw is derived from the then-applicable results.

## 6. Historical data required by the caller

The library does not look up historical tournaments.

The caller must provide the historical rated-game information required for a player who is still subject to performance rating.

At minimum, each retained historical game needs:

- opponent post-event rating,
- result.

There is no fixed maximum look-back window in the FESA rule. A player who remains all-win or all-loss can theoretically require an arbitrarily long prior-game sequence.

Once a player is no longer subject to performance rating, individual historical games are no longer required for numeric rating calculation, although aggregate state remains necessary for other rules such as the 100-game bonus.

## 7. Prior grade

For a player's first rated tournament, if the player has a recognized prior grade, two synthetic results are included:

- one win,
- one loss,

both against the midpoint rating of that grade from the FESA grade table.

These synthetic games count toward the 9-game and 18-game thresholds in the FESA grade rules.

Online-site grades are not recognized by the published FESA rule.

The conversion from grade to midpoint rating belongs inside `fesa-elo`, not in the caller.

## 8. Lower limits

- Hard player-rating lower limit: `1`
- Soft opponent-rating lower limit: `400`

If a calculated player rating is below 1, use 1.

When an opponent's rating would be below 400 for rating calculation, use 400 as the opponent rating.

## 9. Upset gain

For a win against a sufficiently higher-rated opponent, compare the normal win gain with:

```
k(pr) * (or - pr) / 160
```

If this upset-gain value is larger, use it instead of the normal win gain.

## 10. Under-1800 development bonus

When the normal calculation from section 2 is used and the player's pre-game rating is below 1800, add:

```
(1800 - pr) / 200
```

per game.

This bonus is limited to the player's first 100 applicable games.

The caller therefore needs to persist sufficient aggregate state to know how many bonus-counted games have already been consumed.

The exact relation between historical `games` and `bonus-count` in the legacy implementation must be verified with compatibility fixtures before the persistence model is finalized.

## 11. Which games are rated

The library should support the distinction between games that count for tournament standings and games that count for rating.

According to the published FESA rule:

- the tournament's rated status is decided before the tournament,
- only games with a qualifying time control are rated,
- unplayed games are not rated,
- Sennichite is rated as a draw,
- a replay may itself be rated only if its own time control qualifies.

The library should receive only rated games, or receive an explicit `rated: false` flag and ignore those games. The preferred public API is to make rated eligibility explicit and deterministic.

## 12. Handicap

FESA supports rating adjustment for specified handicaps:

| Handicap | Grade-equivalent effect |
| --- | ---: |
| Sente instead of furigoma | 0.2 |
| Lance | 0.6 |
| Bishop | 1.5 |
| Rook | 2.1 |
| Rook + Lance | 2.7 |
| 2 pieces | 3.6 |
| 4 pieces | 5.0 |
| 5 pieces | 6.5 |
| 6 pieces | 8.0 |

The handicap effect is converted through the FESA grade lower-bound scale and alters the opponent rating used for each side's calculation.

The public API should model handicap explicitly even if the first consuming application does not use it.

## 13. Grade and promotion rules

FESA grade assignment and promotion are related to rating but are a separate concern.

Initial implementation should separate:

1. numeric rating calculation,
2. grade/promotion evaluation.

The library may eventually expose grade utilities, but consumers must not be forced to use automatic promotion logic merely to calculate Elo ratings.

## 14. Persistence boundary

The library is pure calculation code.

It must not know about:

- SQL or D1,
- tournament IDs,
- user-account IDs,
- organization-specific participant records,
- API routes,
- UI state.

The caller owns persistence.

A consuming application should normally persist:

- current rating,
- rated game count,
- development-bonus progress,
- whether detailed prior games are still needed for performance rating,
- those prior-game snapshots when needed,
- calculation version / library version if auditability is required.

## 15. Migration from an existing rating ledger

A player with an already-established historical rating can be imported as a baseline state.

If the player is already in normal Elo calculation and the necessary aggregate counters are known, old individual games do not have to be recreated.

If a player is still subject to performance rating, exact continuation requires the retained prior-game data described in section 6.

If only a current rating is known and required counters/history are unavailable, the consuming system must treat the migration as a declared baseline rather than pretending that earlier calculations are reproducible.

## 16. Open verification items

Before a stable `1.0.0` API, verify at least:

- exact rounding behavior,
- exact tournament convergence/stability condition,
- ordering effects within one tournament,
- 100-game bonus counter semantics,
- prior-grade synthetic-game persistence/counting,
- performance-rating history representation,
- handicap conversion edge cases,
- differences between current FESA prose rules and `turnering.lisp`.
