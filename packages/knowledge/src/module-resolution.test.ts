import assert from "node:assert/strict";
import test from "node:test";
import { createModuleResolver } from "./module-resolution";

test("resolves relative paths and TypeScript aliases", () => {
  const files = ["tsconfig.json", "src/auth.ts", "src/lib/billing/client.ts", "src/app/api/checkout/route.ts"];
  const resolver = createModuleResolver(files, new Map([
    ["tsconfig.json", '{\n // project alias\n "compilerOptions": { "paths": { "@/*": ["./src/*",], }, },\n}'],
  ]));
  assert.equal(resolver.resolve("src/app/api/checkout/route.ts", "@/auth"), "src/auth.ts");
  assert.equal(resolver.resolve("src/app/api/checkout/route.ts", "@/lib/billing/client"), "src/lib/billing/client.ts");
  assert.equal(resolver.resolve("src/app/api/checkout/route.ts", "./route"), "src/app/api/checkout/route.ts");
  assert.equal(resolver.resolve("src/app/api/checkout/route.ts", "stripe"), undefined);
});
