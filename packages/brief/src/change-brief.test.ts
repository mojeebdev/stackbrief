import assert from "node:assert/strict";
import test from "node:test";
import { FileSystem } from "../../core/src";
import { scanRepository } from "../../scanner/src";
import { createFileChangeBrief, createStagedChangeBrief, renderChangeBrief, renderStagedChangeBrief } from "./change-brief";

class MemoryFileSystem implements FileSystem {
  public constructor(private readonly files: Record<string, string>) {}
  public listFiles(): string[] { return Object.keys(this.files).sort(); }
  public readText(file: string): string { return this.files[file.replace(/^repository[\\/]/, "").replace(/\\/g, "/")]; }
}

test("creates a concise, source-cited brief from canonical repository facts", () => {
  const report = scanRepository({
    root: "repository",
    fileSystem: new MemoryFileSystem({
      "package.json": JSON.stringify({ name: "payments", dependencies: { express: "1", stripe: "2", "@prisma/client": "3" } }),
      "src/server.ts": "import { refund } from './billing/refunds';\napp.post('/refunds', refund);",
      "src/billing/refunds.ts": "import { readFileSync } from 'node:fs';\nimport Stripe from 'stripe';\nimport { PrismaClient } from '@prisma/client';\nexport function refund() { return [readFileSync, Stripe, PrismaClient]; }",
      "tests/refunds.test.ts": "import { refund } from '../src/billing/refunds';\nrefund();",
    }),
  });

  const brief = createFileChangeBrief(report, "src/server.ts");
  assert.ok(brief);
  assert.equal(brief.startingPoint.id, "file:src/server.ts");
  assert.deepEqual(brief.relevantArchitecture.routes.map(({ id }) => id), ["route:file:src/server.ts:2:POST"]);
  assert.deepEqual(brief.relevantArchitecture.services.map(({ id }) => id), ["service:http:project_root"]);
  assert.deepEqual(brief.relevantArchitecture.databases.map(({ id }) => id), ["database:Prisma"]);
  assert.deepEqual(brief.relevantArchitecture.externalApis.map(({ id }) => id), ["api:project_root:stripe"]);
  assert.deepEqual(brief.validationTargets.map(({ id }) => id), ["file:tests/refunds.test.ts"]);
  assert.match(renderChangeBrief(brief), /Observed constraints/);
  assert.match(renderChangeBrief(brief), /src\/server.ts:2/);
  assert.match(renderChangeBrief(brief), /static brief/);
  assert.doesNotMatch(renderChangeBrief(brief), /node:fs.*not resolved/);
  assert.equal(createFileChangeBrief(report, "missing.ts"), undefined);
});

test("does not treat configuration files as code requiring a test link", () => {
  const report = scanRepository({
    root: "repository",
    fileSystem: new MemoryFileSystem({ "package.json": JSON.stringify({ name: "configuration-only" }) }),
  });
  const brief = createFileChangeBrief(report, "package.json");
  assert.ok(brief);
  assert.doesNotMatch(renderChangeBrief(brief), /No directly connected test file/);
});

test("shows a static outbound HTTP provider through its adapter file", () => {
  const report = scanRepository({
    root: "repository",
    fileSystem: new MemoryFileSystem({
      "package.json": JSON.stringify({ name: "payments", dependencies: { next: "1" } }),
      "tsconfig.json": JSON.stringify({ compilerOptions: { paths: { "@/*": ["./src/*"] } } }),
      "src/app/api/checkout/route.ts": "import { startCheckout } from '@/lib/billing/client';\nexport async function POST() { return startCheckout(); }",
      "src/lib/billing/client.ts": "const BILLING_BASE = 'https://billing.example.test';\nexport const startCheckout = () => fetch(`${BILLING_BASE}/checkout/start`);",
    }),
  });
  const brief = createFileChangeBrief(report, "src/app/api/checkout/route.ts");
  assert.ok(brief);
  assert.deepEqual(brief.relevantArchitecture.externalApis.map(({ label, evidence }) => ({ label, evidence })), [{ label: "Billing via src/lib/billing/client.ts", evidence: [{ file: "src/lib/billing/client.ts", line: 1 }, { file: "src/lib/billing/client.ts", line: 2 }] }]);
});

test("does not cite an unrelated route for a project-level HTTP service", () => {
  const report = scanRepository({
    root: "repository",
    fileSystem: new MemoryFileSystem({
      "package.json": JSON.stringify({ name: "service", dependencies: { express: "1" } }),
      "src/a.ts": "app.get('/first', () => {});",
      "src/b.ts": "app.post('/second', () => {});",
    }),
  });
  const brief = createFileChangeBrief(report, "src/b.ts");
  assert.ok(brief);
  const output = renderChangeBrief(brief);
  assert.match(output, /src\/b.ts:1/);
  assert.doesNotMatch(output, /src\/a.ts/);
});

test("merges file briefs into a deterministic staged change brief", () => {
  const report = scanRepository({
    root: "repository",
    fileSystem: new MemoryFileSystem({
      "package.json": JSON.stringify({ name: "payments", dependencies: { express: "1", stripe: "2" } }),
      "src/server.ts": "import { refund } from './refunds';\napp.post('/refunds', refund);",
      "src/refunds.ts": "import Stripe from 'stripe';\nexport function refund() { return Stripe; }",
      "tests/refunds.test.ts": "import { refund } from '../src/refunds';\nrefund();",
    }),
  });
  const brief = createStagedChangeBrief(report, ["src/refunds.ts", "src/server.ts", "src/refunds.ts"]);
  assert.ok(brief);
  assert.deepEqual(brief.changedFiles.map(({ id }) => id), ["file:src/refunds.ts", "file:src/server.ts"]);
  assert.deepEqual(brief.relevantArchitecture.routes.map(({ id }) => id), ["route:file:src/server.ts:2:POST"]);
  assert.deepEqual(brief.relevantArchitecture.externalApis.map(({ id }) => id), ["api:project_root:stripe"]);
  assert.deepEqual(brief.validationTargets.map(({ id }) => id), ["file:tests/refunds.test.ts"]);
  assert.match(renderStagedChangeBrief(brief), /staged change \(2 files\)/);
  assert.equal(createStagedChangeBrief(report, ["missing.ts"]), undefined);
});
