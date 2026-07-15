# StackBrief

> The architectural brief before a code change.

[GitHub](https://github.com/mojeebdev/stackbrief) · [npm](https://www.npmjs.com/package/@blindspotlab/stackbrief) · [Launch post](https://x.com/tmojeeb/status/2076402340777673176?s=20)

StackBrief is an open-source, local-first CLI for understanding a repository before changing it. It turns source code, imports, routes, services, databases, and external APIs into a source-cited architectural brief—so a developer or coding agent can see the shape of a change before touching the code.

It works without an API key, hosted AI, embeddings, or a vector database. Static analysis provides evidence; developers retain judgement over runtime, product, and operational decisions.

## Start here

```bash
# Create the canonical machine-readable repository model
npx @blindspotlab/stackbrief scan

# Read the architecture around a planned file change
npx @blindspotlab/stackbrief brief --file src/billing/refunds.ts

# Review the architecture around a real staged change
npx @blindspotlab/stackbrief brief --staged
```

`brief --file` is the everyday workflow. Use it when you have identified the most likely file to change and want evidence before your first edit. Use `brief --staged` only after staging a real change; it is not a reason to create artificial Git changes.

## What it gives you

`stackbrief scan` writes `stackbrief.json`, StackBrief’s canonical, versioned repository representation. It contains source evidence for:

- Projects, directories, files, imports, and exports
- Languages, package managers, frameworks, entry points, and environment variables
- Routes, services, databases, dependencies, and external APIs
- Build, test, worker, and queue signals

`stackbrief brief` turns those facts into a concise pre-change brief:

- The selected file and relevant route/service boundary
- Reached local files and direct dependents
- Database and external API integrations
- Constraints, test targets, and static unknowns
- File paths and line citations wherever practical

StackBrief is framework-aware but framework-neutral. For example, it detects Express-style routes and Next.js App Router handlers without assuming that either framework is universal.

See [CHANGE_BRIEF.md](CHANGE_BRIEF.md) for the Alpha contract and static-analysis boundaries, [STACKBRIEF_SCHEMA.md](STACKBRIEF_SCHEMA.md) for the `stackbrief.json` contract, and [REPOSITORY_INTELLIGENCE.md](REPOSITORY_INTELLIGENCE.md) for the typed query engine.

## Bring your own agent

StackBrief’s agent workflow is separate from any model or vendor. It gives an agent instructions to read a StackBrief brief before planning or implementing a change.

```bash
# Install the pre-change workflow in Claude's conventional local skill directory
stackbrief agent install --target claude

# Install it into the skills/instructions directory used by any other agent
stackbrief agent install --target custom --path .agents/skills

# Inspect the destination without writing files
stackbrief agent install --path .agents/skills --dry-run

# Print the portable instructions for manual or system-prompt setup
stackbrief agent print
```

The custom installer creates `<path>/stackbrief/SKILL.md`. It never auto-detects an agent, edits an agent’s configuration silently, or makes a network request.

## Website

The product website is an independent Next.js App Router application in [`apps/web`](apps/web). It has its own dependencies, lockfile, build, metadata, Open Graph image, sitemap, and deployment path; it is deliberately not shipped in the npm CLI package.

```bash
cd apps/web
npm install
npm run dev
```

For Vercel, import this repository and set **Root Directory** to `apps/web`. The intended production home is `stackbrief.peerfix.dev`.

## Architecture

StackBrief is structured so the fast local foundation stays useful whether or not AI is added later:

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

Read [ARCHITECTURE.md](ARCHITECTURE.md) for migration, compatibility, and future milestones. The current CLI does not make OpenAI, Anthropic, or other hosted AI calls.

## Legacy `stacks.md` skill

StackBrief began as `stack.md`, a Claude-compatible skill for producing a deeper `stacks.md` document. That workflow remains available for existing users and is intentionally preserved:

```bash
# Project-local legacy Claude skill installation
npx @blindspotlab/stackbrief

# Global legacy Claude skill installation
npx @blindspotlab/stackbrief --global
```

The original skill source and references remain in [`stackbrief/`](stackbrief/). It is a complementary documentation workflow, not the definition of the current product.

## Origin

StackBrief began as a developer skill called `stack.md`. Repository work made the larger problem obvious: READMEs drift, architecture lives in people’s heads, and the knowledge needed before a change is scattered through the system.

The mission is simple: **help developers understand software systems faster.**

The first public release evolved during OpenAI Build Week 2026. It is a genesis chapter, not the final destination.

## Contributing

Issues, framework adapters, detectors, tests, and clearer evidence are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), start with the [GitHub repository](https://github.com/mojeebdev/stackbrief), or contact [hello@mojeeb.xyz](mailto:hello@mojeeb.xyz) with an idea or contribution proposal.

If StackBrief earns a place in your workflow, please star the repository and leave a review on [npm](https://www.npmjs.com/package/@blindspotlab/stackbrief).

## Built by

StackBrief is built by [Mojeeb Titilayo](https://mojeeb.xyz), an AI Product Engineer and founder of [BlindspotLab](https://blindspotlab.xyz)—a historian turned builder who has shipped 30+ products across AI, developer tools, SaaS, and Web3.

For local-analysis privacy and vulnerability reporting, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
