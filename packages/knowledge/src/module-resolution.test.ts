import assert from "node:assert/strict";
import test from "node:test";
import { createModuleResolver } from "./module-resolution";

test("resolves relative paths and TypeScript aliases", () => {
  const files = ["tsconfig.json", "src/auth.ts", "src/lib/paystack/client.ts", "src/app/api/paystack/route.ts"];
  const resolver = createModuleResolver(files, new Map([
    ["tsconfig.json", '{\n // project alias\n "compilerOptions": { "paths": { "@/*": ["./src/*",], }, },\n}'],
  ]));
  assert.equal(resolver.resolve("src/app/api/paystack/route.ts", "@/auth"), "src/auth.ts");
  assert.equal(resolver.resolve("src/app/api/paystack/route.ts", "@/lib/paystack/client"), "src/lib/paystack/client.ts");
  assert.equal(resolver.resolve("src/app/api/paystack/route.ts", "./route"), "src/app/api/paystack/route.ts");
  assert.equal(resolver.resolve("src/app/api/paystack/route.ts", "stripe"), undefined);
});
