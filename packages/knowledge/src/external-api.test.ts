import assert from "node:assert/strict";
import test from "node:test";
import { FileNode } from "../../types/src";
import { findOutboundHttpApis } from "./external-api";

test("detects a provider adapter built from a URL constant and fetch", () => {
  const files: FileNode[] = [{ id: "file:src/lib/paystack/client.ts", path: "src/lib/paystack/client.ts", directoryId: "directory:src/lib/paystack", projectId: "project:root", kind: "source", language: "TypeScript", isTest: false, evidence: [{ file: "src/lib/paystack/client.ts" }] }];
  const apis = findOutboundHttpApis(new Map([["src/lib/paystack/client.ts", 'const PAYSTACK_BASE = "https://api.paystack.co";\nfetch(`${PAYSTACK_BASE}/transaction/initialize`);']]), files);
  assert.deepEqual(apis, [{ name: "Paystack", host: "api.paystack.co", projectId: "project:root", adapterFileId: "file:src/lib/paystack/client.ts", evidence: [{ file: "src/lib/paystack/client.ts", line: 1 }, { file: "src/lib/paystack/client.ts", line: 2 }] }]);
});
