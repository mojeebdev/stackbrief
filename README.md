# StackBrief

> The architectural brief before a code change.

**Evaluating StackBrief for Build Week?** Follow the [judge-ready evaluation guide](JUDGES.md) for a reproducible path from clone to scan to source-cited pre-change brief.

[GitHub](https://github.com/mojeebdev/stackbrief) · [npm](https://www.npmjs.com/package/@blindspotlab/stackbrief) · [Project home](https://stackbrief.peerfix.dev) · [Launch post](https://x.com/MojeebMotion/status/2078447946782163291?s=20)

StackBrief is an open-source, local-first CLI for understanding a repository before changing it. It turns observable source structure—files, imports, routes, services, databases, dependencies, and external APIs—into a concise architectural brief with file and line evidence.

It is designed for the moment between identifying a likely file and making the first edit. The brief helps a developer or coding agent see the shape of a change; it does not make the change or decide whether the change is correct.

## Why StackBrief exists

The difficult part of a code change is often not writing the code. It is reconstructing enough of the system to make a safe decision.

READMEs drift. Architecture is distributed across source files, manifests, route handlers, shared services, and runtime configuration. Much of that knowledge lives in a maintainer's head until a change exposes it. StackBrief makes the static, inspectable part of that context available before the edit.

The working principle is **understand before change**:

- Start from a concrete file, not an abstract request about an entire repository.
- Follow evidence through the repository instead of relying on broad summaries.
- Make dependencies and boundaries visible while the developer can still choose a different approach.
- State uncertainty when static analysis cannot establish a fact.

## Start here

Run StackBrief from the root of a local repository. It requires Node.js `16.7+`; no account, API key, hosted model, or network connection is needed for analysis.

```bash
# Create the canonical machine-readable repository model.
npx @blindspotlab/stackbrief scan

# Read the architecture around a planned file change.
npx @blindspotlab/stackbrief brief --file src/billing/refunds.ts

# Review the architecture around a real staged change.
npx @blindspotlab/stackbrief brief --staged
```

`brief --file` is the everyday workflow. Use it when you have identified the most likely file to change and want evidence before the first edit. Use `brief --staged` only after staging a real change; it is not a reason to create artificial Git changes.

## What a brief contains

`stackbrief brief` reports source-cited facts around the selected file:

- The selected file and relevant route or service boundary
- Reached local files and direct import dependents
- Database and external API integrations found along the traced path
- Constraints, directly connected test targets, and static unknowns
- File paths and line citations wherever extraction can identify them

The output is deliberately concise. StackBrief aims to create a useful review surface, not a substitute for reading the code or validating the system at runtime.

## Local analysis, evidence, and `stackbrief.json`

`stackbrief scan` writes `stackbrief.json`, a deterministic, versioned snapshot of the repository. It is the canonical machine-readable representation used by the knowledge layer, the intelligence engine, and brief rendering.

The report contains source evidence for:

- Projects, directories, files, imports, and exports
- Languages, package managers, frameworks, entry points, and environment-variable names
- Routes, services, databases, dependencies, and external APIs
- Build, test, worker, and queue signals

Every future capability must build on this model rather than create a parallel view of the repository. That keeps results consistent, inspectable, and usable offline. See [STACKBRIEF_SCHEMA.md](STACKBRIEF_SCHEMA.md) for the contract and compatibility rules, and [REPOSITORY_INTELLIGENCE.md](REPOSITORY_INTELLIGENCE.md) for the typed query layer.

Local-first is also a privacy boundary. The scanner, knowledge model, intelligence engine, and brief renderer make no hosted AI or telemetry request. Generated reports can still reveal file paths, integration names, and environment-variable names, so treat them according to the repository's security policy. See [SECURITY.md](SECURITY.md).

## Engineering boundaries

StackBrief is static analysis. That is an intentional trade-off: it is fast, repeatable, and safe to run locally, but it cannot prove runtime behavior.

StackBrief intentionally does **not**:

- execute application code, inspect production traffic, or validate feature flags;
- invent business intent, authorization guarantees, or runtime certainty;
- upload repository data to answer a question;
- require a hosted model to produce value; or
- replace code review, tests, or developer judgement.

When imports are dynamic, configuration is runtime-dependent, or a direct test link cannot be established, the brief marks that as an unknown. Evidence is more useful than confidence without proof.

## Bring your own agent

StackBrief can give an agent portable instructions to read a StackBrief brief before planning or implementing a change. This workflow is separate from any model vendor.

```bash
# Install the pre-change workflow in Claude's conventional local skill directory.
stackbrief agent install --target claude

# Install it into a skills or instructions directory used by another agent.
stackbrief agent install --target custom --path .agents/skills

# Inspect the destination without writing files.
stackbrief agent install --path .agents/skills --dry-run

# Print portable instructions for manual or system-prompt setup.
stackbrief agent print
```

The custom installer creates `<path>/stackbrief/SKILL.md`. It never auto-detects an agent, edits an agent configuration silently, or makes a network request. AI can extend StackBrief; it does not define the product.

## Architecture

```text
packages/
  cli/            Commands and compatibility routing
  core/           Shared filesystem and Git utilities
  scanner/        Offline repository discovery
  knowledge/      Canonical source-cited repository model
  intelligence/   Typed graph queries and traversal
  brief/          Pre-change and staged-change brief rendering
  types/          Stable public domain contracts

apps/
  web/            Independent Next.js product home
```

The CLI, scanner, knowledge model, intelligence engine, and briefs are deliberately small modules with clear boundaries. Read [ARCHITECTURE.md](ARCHITECTURE.md) for compatibility rules, implemented boundaries, and future directions.

Future work may add deterministic documentation, architecture diffs, local retrieval, and optional provider adapters. Those are directions, not promises. They must remain source-cited, build on `stackbrief.json`, and preserve the offline core.

## Origin and Build Week 2026

StackBrief began as `stack.md`, a developer skill for understanding the technology stack in an unfamiliar repository. Repeated use exposed the larger problem: developers spend more time reconstructing systems than writing individual lines of code. The useful question was not only “what is in this stack?” but “what does this planned change touch?” That shift turned `stack.md` into StackBrief.

The first public release evolved during OpenAI Build Week 2026. GPT-5.6 was used to challenge product assumptions, review architecture, pressure-test the roadmap, identify unnecessary complexity, refine module boundaries, and improve documentation. Codex then accelerated implementation, refactoring, testing, release preparation, package organization, frontend work, and documentation.

AI accelerated engineering; it did not replace engineering judgement. The repository's local-first analysis path does not make OpenAI, Anthropic, or other hosted AI calls.

## Legacy `stacks.md` skill

The original Claude-compatible skill remains available for existing users and is intentionally preserved:

```bash
# Project-local legacy Claude skill installation.
npx @blindspotlab/stackbrief

# Global legacy Claude skill installation.
npx @blindspotlab/stackbrief --global
```

The original skill source and references remain in [`stackbrief/`](stackbrief/). It is a complementary documentation workflow, not the definition of the current product.

## Website

The product website is an independent Next.js App Router application in [`apps/web`](apps/web). It has its own dependencies, metadata, Open Graph image, sitemap, and deployment path; it is deliberately not shipped in the npm CLI package.

```bash
cd apps/web
npm ci
npm run build
```

For Vercel, import this repository and set **Root Directory** to `apps/web`. The intended production home is [stackbrief.peerfix.dev](https://stackbrief.peerfix.dev).

## Contributing

Contributions that improve evidence, false-positive handling, framework awareness, test coverage, or documentation are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), start with the [GitHub repository](https://github.com/mojeebdev/stackbrief), or contact [hello@mojeeb.xyz](mailto:hello@mojeeb.xyz) with an idea or contribution proposal.

If StackBrief earns a place in your workflow, please star the repository and leave a review on [npm](https://www.npmjs.com/package/@blindspotlab/stackbrief).

## Built by

StackBrief is built by [Mojeeb Titilayo](https://mojeeb.xyz), an AI Product Engineer and founder of [BlindspotLab](https://blindspotlab.xyz)—a historian turned builder who has shipped 30+ products across AI, developer tools, SaaS, and Web3. Follow [@MojeebMotion](https://x.com/MojeebMotion) on X.

## License

[MIT](LICENSE)
