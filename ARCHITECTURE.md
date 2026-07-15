# StackBrief Evolution Architecture

## Direction

StackBrief remains an installable Claude skill while gaining an optional, fast, local repository-analysis CLI. Existing invocations (`stackbrief`, `stackbrief init`, and `stackbrief --global`) keep their current installer behavior. New capabilities are opt-in commands.

`stackbrief.json` is the versioned, machine-readable contract between analysis, documentation, graph, retrieval, and diff features. It is generated entirely locally in Phase 1 and intentionally contains evidence that points back to source files.

## Package boundaries

```
packages/
  cli/          Command parsing, rendering, compatibility routing
  core/         Filesystem abstractions and shared execution utilities
  scanner/      Offline repository discovery and stackbrief.json generation
  parser/       Language-aware source parsing (future)
  summarizer/   Deterministic documentation views (future)
  knowledge/    Source-cited repository graph (future)
  retrieval/    Local retrieval interfaces and implementations (future)
  diff/         Commit-to-commit architecture analysis (future)
  providers/    Provider-neutral AI contracts (future)
  openai/       Optional OpenAI provider adapter (future; no API calls)
  types/        Stable domain models and public contracts
```

Dependencies point inward: `cli -> scanner/core/types`; future `summarizer`, `knowledge`, and `diff` consume `scanner` and `types`; `retrieval` consumes `knowledge`; `providers/openai` implement interfaces owned by `providers`. No analyzer imports an AI provider.

## Compatibility and migration

1. Keep the existing package name, CommonJS executable, skill files, and default installer semantics.
2. Turn `bin/cli.js` into a tiny compatibility router. It invokes the TypeScript CLI only for recognized additive commands.
3. `stackbrief.json` is currently at `schemaVersion: 2`. Readers must reject unsupported major schemas with an actionable message; incompatible changes require a schema-version increment and migration note.
4. Keep generated documentation separate from the legacy `stacks.md` workflow. A later `docs` command will add output without changing the skill's behavior.
5. Add AI only behind provider interfaces and explicit configuration. The local scanner, graph, retrieval, docs, and diff paths remain useful offline.

## Milestones

1. **Offline scanner (implemented now):** workspace foundation, typed report contract, deterministic detection, source evidence, `stackbrief scan`, and `stackbrief.json`.
2. **Knowledge graph (implemented now):** a source-cited, ID-based repository model for projects, directories, files, imports, exports, services, routes, databases, external APIs, and dependencies.
3. **Repository intelligence engine (implemented now):** typed offline queries and source-cited graph traversal over the canonical report, designed as the shared foundation for later docs, diff, chat, MCP, and web consumers.
4. **Documentation:** deterministic `stackbrief docs` that produces `stackbrief.md`, README summary, architecture overview, and onboarding guide from the report/graph.
5. **Repository chat:** local retrieval and `stackbrief ask`, with citations and confidence scoring; AI interfaces exist but no provider integration is required.
6. **Architecture diff:** `stackbrief diff <commitA> <commitB>` compares normalized snapshots and reports architectural changes.
7. **Optional AI providers:** provider-neutral contracts followed by an isolated OpenAI Responses/embeddings implementation, enabled only by user configuration.

## Phase 1 scope

The scanner reads common manifests, configuration files, and text source files without network access. It detects languages, package managers, frameworks, entry points, environment variables, API routes, databases, queues, workers, build tools, and testing tools. Each finding includes file and line evidence when practical. It does not parse every programming language semantically; that is the responsibility of the later parser and knowledge milestones.
