# Changelog

All notable changes to StackBrief are documented here.

## 1.1.1 — 2026-07-15

### Changed

- Replaced product-specific examples with neutral checkout and billing fixtures across the website, documentation, and tests.
- Generalized outbound HTTP provider labels for unrecognized hosts.
- Added a rendered Remotion walkthrough to the product website.

## 1.1.0 — 2026-07-15

### Added

- Offline repository scanning with canonical, versioned `stackbrief.json` output.
- Source-cited knowledge model for projects, directories, files, imports, exports, services, routes, databases, external APIs, and dependencies.
- Typed Repository Intelligence Engine queries and import/dependency traversal.
- `stackbrief brief --file <path>` for source-cited pre-change briefs.
- `stackbrief brief --staged` for a merged brief of staged Git changes.
- TypeScript path alias resolution and framework-aware Next.js App Router route detection.
- Static outbound HTTP provider detection, including adapters assembled from URL constants.
- Provider-neutral agent workflow installation through `stackbrief agent install`.
- Independent Next.js product website in `apps/web`.

### Changed

- Repositioned StackBrief around the architectural brief before a code change.
- Updated npm package metadata, README, release verification, and publish safeguards.

### Preserved

- The legacy `stacks.md` Claude-compatible skill and its existing installation behavior remain available.
