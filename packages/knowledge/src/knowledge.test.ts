import assert from "node:assert/strict";
import test from "node:test";
import { buildRepositoryKnowledge } from "./knowledge";

test("builds a normalized, source-cited model for a multi-project repository", () => {
  const files = [
    "package.json",
    "packages/app/package.json",
    "packages/app/src/db.ts",
    "packages/app/src/server.ts",
  ];
  const knowledge = buildRepositoryKnowledge({
    repositoryName: "workspace",
    files,
    texts: new Map([
      ["package.json", JSON.stringify({ name: "workspace" })],
      ["packages/app/package.json", JSON.stringify({ name: "app", dependencies: { prisma: "1", stripe: "2" }, devDependencies: { vitest: "3" } })],
      ["packages/app/src/db.ts", "export class Database {}\nexport { Database as Db };"],
      ["packages/app/src/server.ts", "import { Database } from './db';\nimport Stripe from 'stripe';\nexport const server = {};"],
    ]),
    inventory: {
      languages: [], frameworks: [], entryPoints: [], environmentVariables: [], queues: [], workers: [], buildTools: [], testingFrameworks: [],
      apis: [{ method: "GET", path: "/health", evidence: [{ file: "packages/app/src/server.ts", line: 1 }] }],
      databases: [{ name: "Prisma", evidence: [{ file: "packages/app/package.json" }] }],
    },
  });

  assert.deepEqual(knowledge.projects.map(({ id, name }) => ({ id, name })), [
    { id: "project:packages/app", name: "app" },
    { id: "project:root", name: "workspace" },
  ]);
  assert.ok(knowledge.directories.some(({ id, parentDirectoryId }) => id === "directory:packages/app/src" && parentDirectoryId === "directory:packages/app"));
  assert.deepEqual(knowledge.files.find(({ path }) => path === "packages/app/src/server.ts"), {
    id: "file:packages/app/src/server.ts", path: "packages/app/src/server.ts", directoryId: "directory:packages/app/src", projectId: "project:packages/app", kind: "source", language: "TypeScript", isTest: false, evidence: [{ file: "packages/app/src/server.ts" }],
  });
  assert.deepEqual(knowledge.imports.find(({ specifier }) => specifier === "./db"), {
    id: "import:file:packages/app/src/server.ts:1:0", sourceFileId: "file:packages/app/src/server.ts", specifier: "./db", kind: "static", importedSymbols: ["Database"], targetFileId: "file:packages/app/src/db.ts", evidence: [{ file: "packages/app/src/server.ts", line: 1 }],
  });
  assert.deepEqual(knowledge.exports.filter(({ fileId }) => fileId === "file:packages/app/src/db.ts").map(({ name, kind }) => ({ name, kind })), [{ name: "Database", kind: "class" }, { name: "Db", kind: "named" }]);
  assert.deepEqual(knowledge.dependencies.map(({ packageName, scope, projectId }) => ({ packageName, scope, projectId })), [
    { packageName: "vitest", scope: "development", projectId: "project:packages/app" },
    { packageName: "prisma", scope: "runtime", projectId: "project:packages/app" },
    { packageName: "stripe", scope: "runtime", projectId: "project:packages/app" },
  ]);
  assert.equal(knowledge.routes[0].serviceId, "service:http:project_packages_app");
  assert.deepEqual(knowledge.databases[0].dependencyIds, ["dependency:project_packages_app:runtime:prisma"]);
  assert.deepEqual(knowledge.apis.map(({ name, dependencyIds }) => ({ name, dependencyIds })), [{ name: "Stripe", dependencyIds: ["dependency:project_packages_app:runtime:stripe"] }]);
});
