import assert from "node:assert/strict";
import test from "node:test";
import { stagedFiles, unstagedFiles } from "./git";

test("normalizes staged and unstaged Git paths", () => {
  assert.deepEqual(stagedFiles("repository", () => "src\\b.ts\nsrc/a.ts\n"), ["src/a.ts", "src/b.ts"]);
  assert.deepEqual(unstagedFiles("repository", () => "src/app.ts\n"), ["src/app.ts"]);
});

test("surfaces a stable error when Git cannot be queried", () => {
  assert.throws(() => stagedFiles("repository", () => { throw new Error("not a repository"); }), /could not read Git change data/);
});
