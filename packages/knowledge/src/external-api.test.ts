import assert from "node:assert/strict";
import test from "node:test";
import { FileNode } from "../../types/src";
import { findOutboundHttpApis } from "./external-api";

test("detects a provider adapter built from a URL constant and fetch", () => {
  const files: FileNode[] = [{ id: "file:src/lib/billing/client.ts", path: "src/lib/billing/client.ts", directoryId: "directory:src/lib/billing", projectId: "project:root", kind: "source", language: "TypeScript", isTest: false, evidence: [{ file: "src/lib/billing/client.ts" }] }];
  const apis = findOutboundHttpApis(new Map([["src/lib/billing/client.ts", 'const BILLING_BASE = "https://billing.example.test";\nfetch(`${BILLING_BASE}/checkout/start`);']]), files);
  assert.deepEqual(apis, [{ name: "Billing", host: "billing.example.test", projectId: "project:root", adapterFileId: "file:src/lib/billing/client.ts", evidence: [{ file: "src/lib/billing/client.ts", line: 1 }, { file: "src/lib/billing/client.ts", line: 2 }] }]);
});
