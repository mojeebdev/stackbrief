import assert from "node:assert/strict";
import test from "node:test";
import { FileSystem } from "../../core/src";
import { scanRepository } from "./scanner";

class MemoryFileSystem implements FileSystem {
  public constructor(private readonly files: Record<string, string>) {}
  public listFiles(): string[] { return Object.keys(this.files).sort(); }
  public readText(file: string): string {
    const relative = file.replace(/^demo[\\/]/, "").replace(/\\/g, "/");
    return this.files[relative];
  }
}

test("scans package signals and source evidence offline", () => {
  const report = scanRepository({
    root: "demo",
    fileSystem: new MemoryFileSystem({
      "package.json": JSON.stringify({ name: "demo", main: "src/index.ts", dependencies: { express: "1", prisma: "1", vitest: "1" } }),
      "pnpm-lock.yaml": "lockfileVersion: 9",
      "src/index.ts": "app.get('/health', () => {});\nconst key = process.env.API_KEY;",
    }),
  });
  assert.equal(report.schemaVersion, 2);
  assert.deepEqual(report.repository.packageManagers.map(({ name }) => name), ["pnpm"]);
  assert.deepEqual(report.inventory.frameworks.map(({ name }) => name), ["Express"]);
  assert.deepEqual(report.inventory.databases.map(({ name }) => name), ["Prisma"]);
  assert.deepEqual(report.inventory.apis[0], { method: "GET", path: "/health", evidence: [{ file: "src/index.ts", line: 1 }] });
  assert.deepEqual(report.inventory.environmentVariables[0], { name: "API_KEY", evidence: [{ file: "src/index.ts", line: 2 }] });
  assert.deepEqual(report.knowledge.projects.map(({ id }) => id), ["project:root"]);
  assert.deepEqual(report.knowledge.routes.map(({ path, method, fileId }) => ({ path, method, fileId })), [{ path: "/health", method: "GET", fileId: "file:src/index.ts" }]);
});

test("resolves TypeScript aliases and extracts Next.js App Router routes", () => {
  const report = scanRepository({
    root: "demo",
    fileSystem: new MemoryFileSystem({
      "package.json": JSON.stringify({ name: "demo", dependencies: { next: "1", stripe: "1" } }),
      "tsconfig.json": JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
      "src/app/api/paystack/initialize/route.ts": "import Stripe from '@/lib/paystack/client';\nexport async function POST() { return Stripe; }",
      "src/lib/paystack/client.ts": "import Stripe from 'stripe';\nexport default Stripe;",
    }),
  });
  assert.deepEqual(report.inventory.apis, [{ path: "/api/paystack/initialize", method: "POST", framework: "nextjs-app-router", evidence: [{ file: "src/app/api/paystack/initialize/route.ts", line: 2 }] }]);
  assert.equal(report.knowledge.imports.find(({ specifier }) => specifier === "@/lib/paystack/client")?.targetFileId, "file:src/lib/paystack/client.ts");
  assert.equal(report.knowledge.routes[0].framework, "nextjs-app-router");
});
