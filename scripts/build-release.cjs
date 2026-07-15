const { execFileSync } = require("node:child_process");
const { rmSync } = require("node:fs");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
rmSync(join(root, "dist"), { recursive: true, force: true });
execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "-p", "tsconfig.release.json"], { cwd: root, stdio: "inherit" });
