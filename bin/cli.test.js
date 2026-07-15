const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { run } = require("./cli.js");

function captureOutput(callback) {
  const output = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (message = "") => output.push(String(message));
  console.error = (message = "") => output.push(String(message));
  try {
    return { result: callback(), output: output.join("\n") };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

test("installs the provider-neutral agent skill into an explicit custom directory", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "stackbrief-agent-"));
  const previousDirectory = process.cwd();
  try {
    process.chdir(fixture);
    const { result, output } = captureOutput(() => run(["agent", "install", "--target", "custom", "--path", ".agents", "--dry-run"]));
    assert.equal(result, 0);
    assert.match(output, /would install/);
    assert.equal(fs.existsSync(path.join(fixture, ".agents", "stackbrief")), false);

    assert.equal(run(["agent", "install", "--target", "custom", "--path", ".agents"]), 0);
    const skill = fs.readFileSync(path.join(fixture, ".agents", "stackbrief", "SKILL.md"), "utf8");
    assert.match(skill, /architectural brief before a code change/);
  } finally {
    process.chdir(previousDirectory);
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("requires an explicit destination for custom agents", () => {
  const { result, output } = captureOutput(() => run(["agent", "install", "--target", "custom"]));
  assert.equal(result, 1);
  assert.match(output, /requires --path/);
});
