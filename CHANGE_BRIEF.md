# Change Brief v1

`stackbrief brief --file <path>` and `stackbrief brief --staged` are StackBrief Alpha's first daily-use workflows. They create concise, static briefs before a developer changes a file or submits a staged change.

The brief never infers a developer's objective or claims runtime certainty. It reports only source-cited repository facts and identifies what static analysis cannot resolve.

## Sections

- **Starting point:** the canonical file selected by the developer.
- **Relevant architecture:** routes, services, databases, and external APIs reachable through local imports.
- **Likely impact:** direct import dependents and local files reached by import traversal.
- **Observed constraints:** factual architectural boundaries present in the traced path.
- **Unknowns:** dynamic/unresolved imports, absent directly connected tests, and static-analysis limits.
- **Validation targets:** directly connected test files.
- **Evidence:** deduplicated file and line citations.

## Staged brief rules

`stackbrief brief --staged` merges the canonical file briefs for Git-indexed added, copied, modified, and renamed paths. It refuses to run when a staged path also has unstaged edits, because the scanner reads the current working-tree snapshot and must not claim that newer content is staged.

Deleted files and full Git-index snapshot analysis are intentionally outside Alpha scope.
