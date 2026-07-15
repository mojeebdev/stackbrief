import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run } from "./index";

test("scan command writes the versioned report", () => {
  const fixture = mkdtempSync(join(tmpdir(), "stackbrief-cli-"));
  const previousDirectory = process.cwd();
  try {
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ name: "fixture", dependencies: { express: "1" } }));
    writeFileSync(join(fixture, "app.ts"), "app.get('/health', () => {});");
    process.chdir(fixture);

    assert.equal(run(["scan"]), 0);
    const report = JSON.parse(readFileSync(join(fixture, "stackbrief.json"), "utf8")) as { schemaVersion: number; inventory: { apis: Array<{ path: string }> } };
    assert.equal(report.schemaVersion, 2);
    assert.deepEqual(report.inventory.apis.map(({ path }) => path), ["/health"]);
  } finally {
    process.chdir(previousDirectory);
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("brief command accepts a file as the Alpha starting point", () => {
  const fixture = mkdtempSync(join(tmpdir(), "stackbrief-cli-"));
  const previousDirectory = process.cwd();
  try {
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ name: "fixture", dependencies: { express: "1" } }));
    writeFileSync(join(fixture, "app.ts"), "app.get('/health', () => {});");
    process.chdir(fixture);
    assert.equal(run(["brief", "--file", "app.ts"]), 0);
    assert.equal(run(["brief"]), 1);
  } finally {
    process.chdir(previousDirectory);
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("staged brief uses Git-indexed paths and rejects overlapping unstaged edits", () => {
  const fixture = mkdtempSync(join(tmpdir(), "stackbrief-cli-git-"));
  const previousDirectory = process.cwd();
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: fixture });
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ name: "fixture", dependencies: { express: "1" } }));
    writeFileSync(join(fixture, "app.ts"), "app.get('/health', () => {});");
    execFileSync("git", ["add", "package.json", "app.ts"], { cwd: fixture });
    process.chdir(fixture);
    assert.equal(run(["brief", "--staged"]), 0);
    writeFileSync(join(fixture, "app.ts"), "app.get('/health', () => {});\napp.post('/health', () => {});");
    assert.equal(run(["brief", "--staged"]), 1);
  } finally {
    process.chdir(previousDirectory);
    rmSync(fixture, { recursive: true, force: true });
  }
});
