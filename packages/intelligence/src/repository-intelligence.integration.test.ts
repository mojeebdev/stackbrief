import assert from "node:assert/strict";
import test from "node:test";
import { FileSystem } from "../../core/src";
import { scanRepository } from "../../scanner/src";
import { createRepositoryIntelligence } from "./repository-intelligence";

class MemoryFileSystem implements FileSystem {
  public constructor(private readonly files: Record<string, string>) {}
  public listFiles(): string[] { return Object.keys(this.files).sort(); }
  public readText(file: string): string { return this.files[file.replace(/^repository[\\/]/, "").replace(/\\/g, "/")]; }
}

test("indexes a scanner-generated report without rescanning files", () => {
  const report = scanRepository({
    root: "repository",
    fileSystem: new MemoryFileSystem({
      "package.json": JSON.stringify({ name: "payments", main: "src/server.ts", dependencies: { prisma: "1", stripe: "2" } }),
      "src/server.ts": "import Stripe from 'stripe';\napp.post('/payments', () => {});",
    }),
  });
  const intelligence = createRepositoryIntelligence(report);
  assert.deepEqual(intelligence.findEntryPoints().map(({ id }) => id), ["file:src/server.ts"]);
  assert.equal(intelligence.findRoutes()[0].fileId, "file:src/server.ts");
  assert.deepEqual(intelligence.traceDependency("src/server.ts")?.dependencyIds, ["dependency:project_root:runtime:stripe"]);
  assert.deepEqual(intelligence.search("payments").map(({ kind }) => kind), ["project", "service", "route"]);
});
