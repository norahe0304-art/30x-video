# URL-to-Video V2 Benchmarks

This directory defines the canonical offline benchmark suite for URL-to-video V2.
It is framework-agnostic and intentionally thin: the main orchestrator should read the manifest, run each URL, and write results in its own output format.

The concrete runner now lives at `../scripts/benchmark-suite.ts`.

Offline expectation:

- Use `--reuse-brand-root <dir>` when you maintain one evidence pack per benchmark.
- Use `--reuse-brand-dir <dir>` when you want to pressure-test one benchmark against one known evidence pack.
- If you run live instead of offline, the runner may fetch directly from the URL and skip local fixtures.

Example:

```bash
node --experimental-strip-types scripts/benchmark-suite.ts --match stripe-fintech --offline --reuse-brand-dir ../stripe-launch-video/public/brand --install --verify --render
```

## What This Suite Measures

Each benchmark run should produce the same six required outputs:

- `evidence_score`: overall score plus sub-scores and a short rationale.
- `chosen_mode`: one of `product-evidence`, `editorial`, or `blocked`.
- `archetype`: primary archetype, with an optional secondary archetype.
- `first_cut`: the initial Remotion-ready artifact or project path.
- `self_review`: evidence, taste, and edit gate notes.
- `human_evaluation`: reviewer judgment on whether the first cut is worth polishing.

## Required Output Shape

The orchestrator can store results however it wants, but each benchmark run should preserve these fields:

```json
{
  "benchmark_id": "stripe-fintech",
  "url": "https://stripe.com",
  "evidence_score": {
    "overall": 0,
    "subscores": {}
  },
  "chosen_mode": "product-evidence",
  "archetype": {
    "primary": "",
    "secondary": null
  },
  "first_cut": {
    "status": "not-run",
    "artifact": ""
  },
  "self_review": {
    "evidence_gate": "",
    "taste_gate": "",
    "edit_gate": ""
  },
  "human_evaluation": {
    "score": 0,
    "decision": "",
    "notes": ""
  }
}
```

## Benchmark Entry Fields

The manifest entries are designed to stay stable over time:

- `id`: stable slug for the benchmark.
- `brand`: display label.
- `category`: one of the target groups requested by the user.
- `url`: canonical source URL.
- `mode_hint`: suggested production line for evaluation only.
- `evidence_profile`: shorthand for expected evidence shape.
- `notes`: human-readable guidance for the benchmark.

## Run Expectations

For each URL, the orchestrator should:

1. Collect brand evidence from the URL.
2. Compute evidence strength and mode selection.
3. Infer an archetype.
4. Produce a first cut or a blocked report.
5. Run self-review.
6. Record a human evaluation slot for later scoring.

The benchmark suite does not define rendering code. It only defines the contract that the renderer and reviewer must satisfy.
