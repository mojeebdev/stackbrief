const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { dirname, join, resolve } = require("node:path");

const repositoryRoot = resolve(__dirname, "..");
const npmCli = process.env.npm_execpath || join(
  dirname(process.execPath),
  process.platform === "win32" ? "node_modules" : "..",
  process.platform === "win32" ? "npm" : "lib",
  ...(process.platform === "win32" ? ["bin", "npm-cli.js"] : ["node_modules", "npm", "bin", "npm-cli.js"]),
);
const releaseDirectory = mkdtempSync(join(tmpdir(), "stackbrief-package-"));
const fixtureDirectory = mkdtempSync(join(tmpdir(), "stackbrief-fixture-"));
const npmCacheDirectory = mkdtempSync(join(tmpdir(), "stackbrief-npm-cache-"));

function run(command, arguments_, options) {
  return execFileSync(command, arguments_, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, npm_config_cache: npmCacheDirectory },
    ...options,
  });
}

function runNpm(arguments_, options) {
  return run(process.execPath, [npmCli, ...arguments_], options);
}

try {
  runNpm(["pack", "--pack-destination", releaseDirectory], { cwd: repositoryRoot });
  const tarballs = readdirSync(releaseDirectory).filter((file) => file.endsWith(".tgz"));
  assert.equal(tarballs.length, 1, "expected npm pack to create one tarball");
  const tarball = join(releaseDirectory, tarballs[0]);

  writeFileSync(join(fixtureDirectory, "package.json"), JSON.stringify({ name: "stackbrief-package-smoke", private: true }), "utf8");
  writeFileSync(join(fixtureDirectory, "app.ts"), "import express from 'express';\nconst app = express();\napp.get('/health', () => {});\n", "utf8");

  runNpm(["install", "--offline", "--ignore-scripts", "--no-package-lock", "--fund=false", "--audit=false", tarball], { cwd: fixtureDirectory });

  const cli = join(fixtureDirectory, "node_modules", "@blindspotlab", "stackbrief", "bin", "cli.js");
  assert.ok(existsSync(cli), "packed CLI executable is missing");
  run(process.execPath, [cli, "scan"], { cwd: fixtureDirectory });
  const report = JSON.parse(readFileSync(join(fixtureDirectory, "stackbrief.json"), "utf8"));
  assert.equal(report.schemaVersion, 2, "packed CLI generated an unexpected report schema");

  const brief = run(process.execPath, [cli, "brief", "--file", "app.ts"], { cwd: fixtureDirectory });
  assert.match(brief, /GET \/health/, "packed CLI did not detect the fixture route");

  run(process.execPath, [cli, "agent", "install", "--target", "custom", "--path", ".agents"], { cwd: fixtureDirectory });
  const installedSkill = join(fixtureDirectory, ".agents", "stackbrief", "SKILL.md");
  assert.ok(existsSync(installedSkill), "packed agent skill is missing");
  assert.match(readFileSync(installedSkill, "utf8"), /architectural brief before a code change/);

  process.stdout.write("Packed StackBrief CLI smoke test passed\n");
} finally {
  rmSync(releaseDirectory, { recursive: true, force: true });
  rmSync(fixtureDirectory, { recursive: true, force: true });
  rmSync(npmCacheDirectory, { recursive: true, force: true });
}
