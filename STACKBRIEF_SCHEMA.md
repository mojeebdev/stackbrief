# `stackbrief.json` schema

`stackbrief.json` is a deterministic, offline repository snapshot. It uses `schemaVersion: 2`.

## Compatibility rules

- Consumers must reject an unknown major schema version rather than silently guessing.
- Node IDs are stable for the same repository path and are safe to use as relationship keys. They are not globally unique across repositories.
- All relationships use IDs, never embedded copies of another node.
- Every inferred node and edge includes `evidence` with at least a source file whenever a source file exists. A `line` is included when extraction can identify one.
- New optional fields and new `kind` strings are additive. Renaming/removing fields or changing relationship semantics requires the next schema version.

### v1 to v2 migration

The concise `repository` and `inventory` sections are retained. Version 2 adds the required normalized `knowledge` section; consumers that only need the concise inventory can migrate by accepting v2, while graph-aware consumers should read `knowledge` exclusively for relationships.

## Top-level structure

```json
{
  "schemaVersion": 2,
  "repository": { "name": "example", "packageManagers": [] },
  "inventory": {},
  "knowledge": {
    "projects": [], "directories": [], "files": [],
    "imports": [], "exports": [], "services": [], "routes": [],
    "databases": [], "apis": [], "dependencies": []
  }
}
```

`inventory` remains the concise Phase 1 summary for backwards-friendly consumption. `knowledge` is the normalized model intended for documentation, retrieval, and architecture diffs.

## Node and relationship conventions

All knowledge collections are arrays of nodes with a deterministic ID and source evidence. Current ID prefixes are `project:`, `directory:`, `file:`, `import:`, `export:`, `service:`, `route:`, `database:`, `api:`, and `dependency:`.

- `projects` own `rootDirectoryId` and `dependencyIds`.
- `directories` form a tree using `parentDirectoryId`.
- `files` point to `directoryId` and `projectId`.
- `imports` point to `sourceFileId`; local imports additionally use `targetFileId`.
- `exports` point to `fileId`.
- `services` point to their owning project, implementation files, and routes.
- `routes` point to their source file and, when known, service.
- `databases` and `apis` point to the dependencies that establish the integration.
- `dependencies` carry their package version, scope, owning project, and manifest evidence.

`kind` fields are deliberately open strings. The current extractor emits values such as `source`, `manifest`, `http-server`, `worker`, `external`, and `detected`; consumers must preserve unknown values for forward compatibility.
