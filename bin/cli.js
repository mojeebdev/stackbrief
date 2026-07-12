#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const args = process.argv.slice(2);
const isGlobal = args.includes("--global") || args.includes("-g");
const command = args.find((a) => !a.startsWith("-")) || "init";

const SOURCE = path.join(__dirname, "..", "stackbrief");

function targetDir() {
  const base = isGlobal
    ? path.join(os.homedir(), ".claude", "skills")
    : path.join(process.cwd(), ".claude", "skills");
  return path.join(base, "stackbrief");
}

function init() {
  const dest = targetDir();

  if (!fs.existsSync(SOURCE)) {
    console.error("Could not find skill source files - package may be corrupted.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(SOURCE, dest, { recursive: true });

  console.log(`stackbrief installed -> ${dest}`);
  console.log("");
  console.log(
    isGlobal
      ? "Available in every project. In Claude Code, say:"
      : "Available in this project. In Claude Code, say:"
  );
  console.log('  "Use the stackbrief skill to document this codebase."');
}

function help() {
  console.log(`stackbrief - install the stackbrief Claude Skill

Usage:
  npx @blindspotlab/stackbrief            Install into ./.claude/skills (this project)
  npx @blindspotlab/stackbrief --global   Install into ~/.claude/skills (all projects)
  npx @blindspotlab/stackbrief help       Show this message
`);
}

if (command === "help" || args.includes("--help") || args.includes("-h")) {
  help();
} else {
  init();
}