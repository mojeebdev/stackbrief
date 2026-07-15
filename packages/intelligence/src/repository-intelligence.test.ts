import assert from "node:assert/strict";
import test from "node:test";
import { StackbriefReport } from "../../types/src";
import { buildRepositoryKnowledge } from "../../knowledge/src";
import { createRepositoryIntelligence } from "./repository-intelligence";

function fixtureReport(): StackbriefReport {
  const files = ["package.json", "src/entry.ts", "src/payments.ts"];
  const inventory = {
    languages: [], frameworks: [], entryPoints: [{ path: "src/entry.ts", kind: "package" as const, evidence: [{ file: "package.json" }] }], environmentVariables: [],
    apis: [{ method: "POST", path: "/payments", evidence: [{ file: "src/entry.ts", line: 3 }] }],
    databases: [{ name: "Prisma", evidence: [{ file: "package.json" }] }], queues: [], workers: [], buildTools: [], testingFrameworks: [],
  };
  return {
    schemaVersion: 2,
    repository: { name: "checkout", packageManagers: [{ name: "npm", evidence: [{ file: "package-lock.json" }] }] },
    inventory,
    knowledge: buildRepositoryKnowledge({
      repositoryName: "checkout",
      files,
      texts: new Map([
        ["package.json", JSON.stringify({ name: "checkout", main: "src/entry.ts", dependencies: { prisma: "1", stripe: "2" } })],
        ["src/entry.ts", "import { pay } from './payments';\nimport Stripe from 'stripe';\napp.post('/payments', pay);\nexport function start() {}"],
        ["src/payments.ts", "import { start } from './entry';\nimport Stripe from 'stripe';\nexport function pay() { return start; }"],
      ]),
      inventory,
    }),
  };
}

test("answers typed lookup and traversal queries with canonical IDs", () => {
  const report = fixtureReport();
  const intelligence = createRepositoryIntelligence(report);

  assert.equal(intelligence.findProject("project:root")?.id, "project:root");
  assert.equal(intelligence.findDirectory("./src/")?.id, "directory:src");
  assert.equal(intelligence.findFile("src/entry.ts")?.id, "file:src/entry.ts");
  assert.deepEqual(intelligence.findFilesByLanguage("typescript").map(({ id }) => id), ["file:src/entry.ts", "file:src/payments.ts"]);
  assert.deepEqual(intelligence.findEntryPoints().map(({ id }) => id), ["file:src/entry.ts"]);
  assert.deepEqual(intelligence.findRoutes().map(({ id }) => id), ["route:file:src/entry.ts:3:POST"]);
  assert.equal(intelligence.findService("checkout HTTP service")?.id, "service:http:project_root");
  assert.equal(intelligence.findDatabase("prisma")?.id, "database:Prisma");
  assert.equal(intelligence.findExternalApi("stripe")?.id, "api:project_root:stripe");
  assert.deepEqual(intelligence.findDependencies().map(({ id }) => id), ["dependency:project_root:runtime:prisma", "dependency:project_root:runtime:stripe"]);
  assert.deepEqual(intelligence.findDependents("file:src/payments.ts").map(({ id }) => id), ["file:src/entry.ts"]);

  assert.deepEqual(intelligence.traceImports("src/entry.ts"), {
    rootFileId: "file:src/entry.ts",
    fileIds: ["file:src/entry.ts", "file:src/payments.ts"],
    importIds: [
      "import:file:src/entry.ts:1:0", "import:file:src/entry.ts:2:1",
      "import:file:src/payments.ts:1:2", "import:file:src/payments.ts:2:3",
    ],
  });
  assert.deepEqual(intelligence.traceExports("src/payments.ts"), { fileId: "file:src/payments.ts", exportIds: ["export:file:src/payments.ts:3:pay"] });
  assert.deepEqual(intelligence.traceDependency("src/entry.ts")?.dependencyIds, ["dependency:project_root:runtime:stripe"]);
  assert.deepEqual(intelligence.search("stripe").map(({ id }) => id), ["api:project_root:stripe", "dependency:project_root:runtime:stripe"]);
});

test("refresh replaces indexes from a later canonical snapshot", () => {
  const report = fixtureReport();
  const intelligence = createRepositoryIntelligence(report);
  intelligence.refresh({ ...report, knowledge: { ...report.knowledge, files: report.knowledge.files.filter(({ path }) => path !== "src/payments.ts") } });
  assert.equal(intelligence.findFile("src/payments.ts"), undefined);
});
