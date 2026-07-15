# Contributing to StackBrief

Thank you for helping make repository changes easier to understand before they happen.

## Before opening a pull request

```bash
npm ci
npm test
npm run test:package

cd apps/web
npm ci
npm run build
```

## Contribution principles

- Preserve offline, deterministic analysis. Do not introduce hosted AI calls into the scanner, knowledge model, or brief path.
- Add source evidence for new findings wherever practical.
- Keep the versioned `stackbrief.json` schema backward compatible. Any breaking schema change requires a version increment and migration note.
- Add focused tests for framework detectors, resolver behavior, knowledge relations, and brief output.
- Do not silently infer business intent from code. Report observable facts and static unknowns separately.
- Keep the CLI and `apps/web` independently buildable.

## Where to help

- Framework-aware route and entry-point detection
- Language-aware parsing and import resolution
- Clearer architecture evidence and false-positive reduction
- Documentation, examples, and real-repository fixtures
- Agent integrations that consume StackBrief’s portable instruction artifact

For a larger proposal, open an issue first or email [hello@mojeeb.xyz](mailto:hello@mojeeb.xyz).
