# StackBrief Evolution Architecture

## Direction

StackBrief is an open-source, local-first developer tool for understanding the architecture before changing code. Its canonical product statement is: **“The architectural brief before a code change.”**

The existing `stack.md` installer remains available for backward compatibility. The CLI adds opt-in repository analysis without changing those legacy invocations (`stackbrief`, `stackbrief init`, and `stackbrief --global`).

`stackbrief.json` is the versioned, machine-readable contract between analysis, documentation, graph, retrieval, and diff features. It is generated entirely locally in Phase 1 and intentionally contains evidence that points back to source files.

## Package boundaries

```
packages/
  cli/           Command parsing, rendering, compatibility routing
  core/          Filesystem abstractions and shared execution utilities
  scanner/       Offline repository discovery and stackbrief.json generation
  knowledge/     Canonical source-cited repository graph and schema builders
  intelligence/  Typed graph queries and shared traversal utilities
  brief/         Deterministic pre-change and staged-change brief rendering
  types/         Stable domain models and public contracts

Planned boundaries, not implemented packages:

  parser/        Broader language-aware source parsing
  summarizer/    Deterministic documentation views
  retrieval/     Local retrieval interfaces and implementations
  diff/          Commit-to-commit architecture analysis
  providers/     Provider-neutral optional AI contracts
  openai/        Optional OpenAI provider adapter; no provider calls in core paths
```

Dependencies point inward. The CLI coordinates scanner, intelligence, and brief views; the scanner produces the canonical report; intelligence indexes and traverses that report; brief rendering consumes canonical report data through the intelligence layer. Future documentation, retrieval, and diff capabilities must consume `stackbrief.json` and its typed knowledge model rather than create parallel repository representations. No analyzer imports an AI provider.

## Compatibility and migration

1. Keep the existing package name, CommonJS executable, skill files, and default installer semantics.
2. Turn `bin/cli.js` into a tiny compatibility router. It invokes the TypeScript CLI only for recognized additive commands.
3. `stackbrief.json` is currently at `schemaVersion: 2`. Readers must reject unsupported major schemas with an actionable message; incompatible changes require a schema-version increment and migration note.
4. Keep generated documentation separate from the legacy `stacks.md` workflow. A future `docs` command can add output without changing the skill's behavior.
5. Add AI only behind provider interfaces and explicit configuration. The local scanner, graph, brief, documentation, retrieval, and diff paths must remain useful offline.

## Milestones

1. **Offline scanner (implemented now):** workspace foundation, typed report contract, deterministic detection, source evidence, `stackbrief scan`, and `stackbrief.json`.
2. **Knowledge graph (implemented now):** a source-cited, ID-based repository model for projects, directories, files, imports, exports, services, routes, databases, external APIs, and dependencies.
3. **Repository intelligence engine (implemented now):** typed offline queries and source-cited graph traversal over the canonical report, designed as the shared foundation for later docs, diff, chat, MCP, and web consumers.
4. **Documentation (future):** deterministic `stackbrief docs` that produces `stackbrief.md`, README summary, architecture overview, and onboarding guide from the report/graph.
5. **Repository chat (future):** local retrieval and `stackbrief ask`, with citations and confidence scoring; AI interfaces may exist but no provider integration is required.
6. **Architecture diff (future):** `stackbrief diff <commitA> <commitB>` compares normalized snapshots and reports architectural changes.
7. **Optional AI providers (future):** provider-neutral contracts followed by isolated provider adapters, enabled only by explicit user configuration.

## Phase 1 scope

The scanner reads common manifests, configuration files, and text source files without network access. It detects languages, package managers, frameworks, entry points, environment variables, API routes, databases, queues, workers, build tools, and testing tools. Each finding includes file and line evidence when practical. It does not parse every programming language semantically; broader parsing remains future work.
