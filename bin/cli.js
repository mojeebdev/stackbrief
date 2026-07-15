#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const PACKAGE_ROOT = path.join(__dirname, "..");
const LEGACY_SKILL_SOURCE = path.join(PACKAGE_ROOT, "stackbrief");
const AGENT_SKILL_SOURCE = path.join(PACKAGE_ROOT, "agent");

function legacyTargetDir(isGlobal) {
  const base = isGlobal
    ? path.join(os.homedir(), ".claude", "skills")
    : path.join(process.cwd(), ".claude", "skills");
  return path.join(base, "stackbrief");
}

function copySkill(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error("Could not find StackBrief skill files - package may be corrupted.");
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}

/** Keeps the original bare npx installer stable for existing Claude users. */
function initLegacyClaudeSkill(isGlobal) {
  const destination = legacyTargetDir(isGlobal);
  copySkill(LEGACY_SKILL_SOURCE, destination);

  console.log(`stackbrief installed -> ${destination}`);
  console.log("");
  console.log(isGlobal
    ? "Available in every project. In Claude Code, say:"
    : "Available in this project. In Claude Code, say:");
  console.log('  "Use the stackbrief skill to document this codebase."');
  return 0;
}

function agentHelp() {
  console.log(`Usage:
  stackbrief agent install --target claude [--global]
  stackbrief agent install --target custom --path <skills-directory>
  stackbrief agent install --path <skills-directory>
  stackbrief agent print

The custom target is provider-neutral. Give --path the directory where your
agent discovers skills or instructions; StackBrief creates <path>/stackbrief/SKILL.md.
Use --dry-run to inspect the destination without writing files.`);
}

function optionValue(args, option) {
  const index = args.indexOf(option);
  return index < 0 ? undefined : args[index + 1];
}

function installAgent(args) {
  const target = optionValue(args, "--target");
  const customPath = optionValue(args, "--path");
  const isGlobal = args.includes("--global") || args.includes("-g");
  const dryRun = args.includes("--dry-run");

  if (target && target !== "claude" && target !== "custom") {
    console.error(`Unsupported agent target: ${target}. Use --target custom --path <skills-directory>.`);
    return 1;
  }
  if (target === "claude" && customPath) {
    console.error("The Claude target chooses its own skills directory; do not combine it with --path.");
    return 1;
  }
  if (target === "custom" && !customPath) {
    console.error("The custom target requires --path <skills-directory>.");
    return 1;
  }
  if (!target && !customPath) {
    console.error("Choose --target claude or provide --path <skills-directory> for a custom agent.");
    return 1;
  }

  const destination = target === "claude"
    ? path.join(isGlobal ? os.homedir() : process.cwd(), ".claude", "skills", "stackbrief")
    : path.resolve(process.cwd(), customPath, "stackbrief");

  if (dryRun) {
    console.log(`StackBrief agent skill would install -> ${destination}`);
    return 0;
  }

  try {
    copySkill(AGENT_SKILL_SOURCE, destination);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unable to install StackBrief agent skill.");
    return 1;
  }

  console.log(`StackBrief agent skill installed -> ${destination}`);
  console.log(`Tell your agent to read ${path.join(destination, "SKILL.md")} before making a code change.`);
  return 0;
}

function agent(args) {
  if (args[0] === "install") return installAgent(args.slice(1));
  if (args[0] === "print") {
    const skill = path.join(AGENT_SKILL_SOURCE, "SKILL.md");
    if (!fs.existsSync(skill)) {
      console.error("Could not find StackBrief agent instructions - package may be corrupted.");
      return 1;
    }
    process.stdout.write(fs.readFileSync(skill, "utf8"));
    return 0;
  }
  agentHelp();
  return args.length === 0 || args.includes("--help") || args.includes("-h") ? 0 : 1;
}

function help() {
  console.log(`stackbrief - offline architectural briefs and agent workflow installer

Usage:
  npx @blindspotlab/stackbrief                         Install legacy stacks.md skill for Claude
  npx @blindspotlab/stackbrief --global                Install legacy Claude skill globally
  stackbrief scan                                      Write an offline stackbrief.json report
  stackbrief scan --output <file>                      Choose the report path
  stackbrief brief --file <path>                       Create a source-cited pre-change file brief
  stackbrief brief --staged                            Create a source-cited brief for staged Git changes
  stackbrief agent install --target claude [--global]  Install the pre-change agent workflow for Claude
  stackbrief agent install --path <skills-directory>   Install it for any custom agent
  stackbrief agent print                               Print the provider-neutral agent instructions
  npx @blindspotlab/stackbrief help                    Show this message
`);
}

function run(args) {
  const command = args.find((argument) => !argument.startsWith("-")) || "init";
  const isGlobal = args.includes("--global") || args.includes("-g");

  if (command === "help" || args.includes("--help") || args.includes("-h")) {
    help();
    return 0;
  }
  if (command === "agent") return agent(args.slice(args.indexOf("agent") + 1));
  if (command === "scan" || command === "brief") {
    const cli = path.join(PACKAGE_ROOT, "dist", "packages", "cli", "src", "index.js");
    if (!fs.existsSync(cli)) {
      console.error("StackBrief CLI files are missing. Reinstall @blindspotlab/stackbrief.");
      return 1;
    }
    const result = spawnSync(process.execPath, [cli, ...args], { stdio: "inherit" });
    return result.status === null ? 1 : result.status;
  }
  return initLegacyClaudeSkill(isGlobal);
}

if (require.main === module) process.exitCode = run(process.argv.slice(2));

module.exports = { agent, installAgent, run };
