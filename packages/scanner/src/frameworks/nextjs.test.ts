import assert from "node:assert/strict";
import test from "node:test";
import { nextAppRoutes } from "./nextjs";

test("extracts Next.js App Router handlers and public paths", () => {
  assert.deepEqual(nextAppRoutes("src/app/(internal)/api/users/[id]/route.ts", "export async function GET() {}\nexport const PATCH = async () => {};"), [
    { path: "/api/users/[id]", method: "GET", framework: "nextjs-app-router", evidence: [{ file: "src/app/(internal)/api/users/[id]/route.ts", line: 1 }] },
    { path: "/api/users/[id]", method: "PATCH", framework: "nextjs-app-router", evidence: [{ file: "src/app/(internal)/api/users/[id]/route.ts", line: 2 }] },
  ]);
  assert.deepEqual(nextAppRoutes("src/pages/api/users.ts", "export function GET() {}"), []);
});
