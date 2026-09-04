# Legacy reference and compatibility policy

## Reference implementation

This project is informed by the existing repository:

- https://github.com/kota/elo_rating

That repository contains:

- `calculate.rb` — adapter/orchestration code used to convert tournament CSV data into the legacy rating program's input/output format.
- `turnering.lisp` — the substantive legacy tournament/rating implementation.
- archived and sample rating-state files used by the legacy workflow.

The new TypeScript project is not intended to invoke Ruby or Common Lisp at runtime.

## Role of `kota/elo_rating`

The legacy repository is useful for three things:

1. understanding historical production behavior,
2. producing golden input/output fixtures,
3. identifying details that are ambiguous in the prose specification.

It is **not** the sole normative source.

The primary specification is the currently published FESA Elo documentation:

- https://fesashogi.eu/elo-system/
- https://fesashogi.eu/rules/

If there is a difference between:

- the published FESA rule,
- the legacy `turnering.lisp`,
- historical operational data,

the difference should be recorded explicitly and resolved rather than silently copying legacy behavior.

## Historical investigation record

Concrete compatibility findings, including the 2018 R135 / company-league reconstruction and the policy for preserving legacy execution evidence, are recorded in:

- [Historical compatibility investigation](./historical-compatibility-investigation.md)

## Known legacy architecture

The legacy workflow is stateful between tournaments.

`calculate.rb` copies the latest archived `ratingliste.post` to the next run's `ratingliste.pre`, then executes:

```
clisp turnering.lisp
```

The Common Lisp program writes the next post-tournament rating state.

The legacy player state includes more than the visible rating number, including game history/counters used by performance rating, bonuses, and grade logic.

This is the reason the TypeScript API must accept more than just `ratingBefore`.

## Compatibility testing strategy

Do not make the TypeScript tests execute the production integration through CSV/Ruby/Common Lisp on every normal test run.

Instead:

1. select representative legacy pre-state,
2. select tournament input,
3. run the legacy implementation once,
4. capture the expected post-state/result,
5. store the case as a fixture,
6. run the TypeScript implementation against that fixture.

Suggested layout:

```
tests/
  specification/
    basic-elo.test.ts
    performance-rating.test.ts
    bonus.test.ts
    handicap.test.ts

  compatibility/
    fixtures/
      case-001/
        input.json
        expected.json
        provenance.md
    legacy-compatibility.test.ts
```

Each compatibility fixture should record:

- source archive/sample,
- legacy commit SHA if known,
- input state,
- tournament results,
- expected output,
- any known discrepancy with the published FESA rule.

## Minimum compatibility cases

Include at least:

- established player with win/loss/draw,
- K-factor boundary values,
- sequential games within a tournament,
- mutually coupled tournament iteration,
- first tournament,
- fewer than 9 total games,
- transition out of performance rating,
- all prior wins,
- all prior losses,
- all current+prior wins,
- all current+prior losses,
- prior grade,
- hard lower limit 1,
- opponent soft lower limit 400,
- upset gain,
- under-1800 bonus,
- 100-game bonus boundary,
- handicap cases,
- tournament-total rounding.

## Legacy code should not leak into the public model

The new API should not expose legacy implementation concepts merely because they appear in `turnering.lisp`.

Examples include serialized Common Lisp structs, Nekomado-specific R-numbers, file names such as `ratingliste.pre`, or `calculate.rb` CSV conventions.

Translate legacy state into domain concepts such as:

- rating,
- rated game count,
- historical rated-game snapshot,
- bonus progress,
- grade,
- handicap.

## License caution

Before copying any substantial source code from `kota/elo_rating` into this repository, verify that its license permits redistribution and derivative use.

Until that is clear, prefer:

- links,
- independent reimplementation from the FESA specification,
- behavioral compatibility fixtures containing only the minimum data required for testing.

The project's documentation may state that `kota/elo_rating` was used as a reference implementation without incorporating its source code.
