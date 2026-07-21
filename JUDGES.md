# StackBrief evaluation guide

StackBrief is **the architectural brief before a code change**. It is an open-source, local-first CLI that turns observable repository structure into a concise, source-cited brief before a developer edits a file or asks an agent to do so.

This guide provides a reproducible way to evaluate the project in a few minutes.

## What to look for

1. **A canonical contract.** `stackbrief.json` is a versioned, machine-readable representation of a repository; it is not generated prose.
2. **Source evidence.** Briefs cite files and line numbers where the scanner can establish them.
3. **Useful uncertainty.** Static analysis labels what it cannot prove instead of inventing runtime certainty.
4. **Local-first behavior.** The scan, knowledge model, intelligence engine, and brief renderer do not require an API key, hosted model, telemetry, or repository upload.

## Reproduce the core workflow

Requirements: Node.js 16.7 or later and Git.

```bash
git clone https://github.com/mojeebdev/stackbrief.git
cd stackbrief
npm ci

# Build the typed packages and run the complete automated suite.
npm test

# Validate the publishable CLI package.
npm run test:package

# Generate the canonical repository model for this repository itself.
node bin/cli.js scan

# Ask for a pre-change brief around a real implementation file.
node bin/cli.js brief --file packages/brief/src/change-brief.ts
```

The final command should produce a concise brief with a starting point, relevant architecture where it can be proven, traced local files, observed constraints, explicit unknowns, and evidence citations.

`stackbrief.json` is generated output. It is intentionally not committed in this repository; inspect it locally after `scan` completes.

## Try the published CLI in another repository

From the root of any local Node/TypeScript repository:

```bash
npx @blindspotlab/stackbrief scan
npx @blindspotlab/stackbrief brief --file path/to/a/real/source-file.ts
```

For a real staged change, after staging files with Git:

```bash
npx @blindspotlab/stackbrief brief --staged
```

Start with a concrete file. StackBrief is intentionally designed to answer “what does this change touch?” rather than generate a vague summary of an entire repository.

## Implemented surface

- Offline repository scanner with a versioned `stackbrief.json` contract.
- Source-cited projects, directories, files, imports, exports, dependencies, services, routes, databases, and external APIs.
- Typed repository-intelligence queries and deterministic import/dependency traversal.
- `brief --file` and `brief --staged` for pre-change context.
- TypeScript path-alias resolution, Next.js App Router route extraction, and static outbound HTTP provider detection.
- Portable, agent-neutral pre-change workflow installation.

## Important limits

StackBrief is static analysis. It does not execute application code, inspect production traffic, evaluate feature flags, infer business authorization rules, or claim that a change is safe. Dynamic behavior and unresolved evidence are surfaced as unknowns.

Framework detection is broader than deep framework-specific extraction today. The implemented Next.js App Router adapter is deliberately isolated so equivalent adapters can be added without changing the canonical schema.

## Build Week context

StackBrief evolved during OpenAI Build Week 2026. GPT-5.6 was used to challenge product assumptions and architecture; Codex accelerated implementation, tests, refactoring, release preparation, documentation, and the product website. The product itself remains useful without hosted AI: AI is an optional consumer of the local, evidence-led foundation.

## Links

- Repository: <https://github.com/mojeebdev/stackbrief>
- npm package: <https://www.npmjs.com/package/@blindspotlab/stackbrief>
- Product home: <https://stackbrief.peerfix.dev>
- Launch post: <https://x.com/MojeebMotion/status/2078447946782163291?s=20>
- Contact: <mailto:hello@mojeeb.xyz>
