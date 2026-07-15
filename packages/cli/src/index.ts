import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createFileChangeBrief, createStagedChangeBrief, renderChangeBrief, renderStagedChangeBrief } from "../../brief/src";
import { stagedFiles, unstagedFiles } from "../../core/src";
import { scanRepository } from "../../scanner/src";

export function run(args: string[]): number {
  const command = args[0];
  if (command === "scan") return scan(args.slice(1));
  if (command === "brief") return brief(args.slice(1));
  process.stderr.write(`Unknown command: ${command ?? ""}. Run stackbrief help for usage.\n`);
  return 1;
}

function scan(args: string[]): number {
  const outputIndex = args.indexOf("--output");
  const output = outputIndex >= 0 ? args[outputIndex + 1] : "stackbrief.json";
  if (!output) {
    process.stderr.write("Missing value for --output.\n");
    return 1;
  }
  const report = scanRepository({ root: process.cwd() });
  writeFileSync(resolve(process.cwd(), output), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`StackBrief report written to ${output}\n`);
  return 0;
}

function brief(args: string[]): number {
  if (args.includes("--staged")) return stagedBrief();
  const fileIndex = args.indexOf("--file");
  const file = fileIndex >= 0 ? args[fileIndex + 1] : undefined;
  if (!file) {
    process.stderr.write("The brief command requires --file <path>.\n");
    return 1;
  }
  const report = scanRepository({ root: process.cwd() });
  const changeBrief = createFileChangeBrief(report, file);
  if (!changeBrief) {
    process.stderr.write(`Could not find the requested file in the repository: ${file}\n`);
    return 1;
  }
  process.stdout.write(`${renderChangeBrief(changeBrief)}\n`);
  return 0;
}

function stagedBrief(): number {
  let staged: string[];
  let unstaged: string[];
  try {
    staged = stagedFiles(process.cwd());
    unstaged = unstagedFiles(process.cwd());
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Unable to read Git changes."}\n`);
    return 1;
  }
  if (staged.length === 0) {
    process.stderr.write("No staged files found. Stage one or more files before creating a staged brief.\n");
    return 1;
  }
  const conflictedPaths = staged.filter((path) => unstaged.includes(path));
  if (conflictedPaths.length > 0) {
    process.stderr.write(`Cannot create a reliable staged brief: these staged files also have unstaged edits: ${conflictedPaths.join(", ")}\n`);
    return 1;
  }
  const report = scanRepository({ root: process.cwd() });
  const changeBrief = createStagedChangeBrief(report, staged);
  if (!changeBrief) {
    process.stderr.write("None of the staged files could be represented in the repository model.\n");
    return 1;
  }
  process.stdout.write(`${renderStagedChangeBrief(changeBrief)}\n`);
  return 0;
}

if (require.main === module) process.exitCode = run(process.argv.slice(2));
