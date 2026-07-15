# Repository Intelligence Engine

`RepositoryIntelligence` is the offline query layer over a generated `stackbrief.json` report. It does not parse source files, modify the report, call a service, or generate IDs. Use `createRepositoryIntelligence(report)` after scanning a repository.

## Query design

Direct lookup APIs (`findProject`, `findFile`, `findDirectory`, and name-based service/integration lookups) use prebuilt maps. Collection APIs return canonical graph nodes. Graph APIs return canonical IDs so clients can retrieve the exact nodes they need without copying or transforming the graph.

```ts
const intelligence = createRepositoryIntelligence(report);
const entryPoints = intelligence.findEntryPoints(); // FileNode[]
const imports = intelligence.traceImports("src/server.ts"); // canonical file/import IDs
const results = intelligence.search("stripe payment"); // canonical IDs + source evidence
```

`findDependents` returns direct local importers. `traceImports` is transitive and cycle-safe. `traceDependency` uses that same traversal, then links non-local import specifiers to dependencies owned by the importing project. `traceExports` returns the graph export IDs declared by one file.

## Extending safely

1. Add canonical nodes or references to `stackbrief.json` first; do not create an engine-only entity model.
2. Extend `IndexState` with the minimal lookup map required by the query.
3. Reuse `walkFileGraph` for file-edge traversal rather than writing a separate DFS/BFS.
4. Return canonical node IDs or nodes carrying their canonical IDs, with unchanged source evidence.
5. Add a focused unit test and a scanner-to-engine integration test.

`refresh(report)` is the update seam. It currently swaps in an index rebuilt from a new deterministic report. A future incremental scanner can replace `buildIndex` with changed-node map updates while retaining the public query API.
