import { execFileSync } from "node:child_process";

export interface GitRunner {
  (arguments_: string[], root: string): string;
}

/** Returns repository-relative paths selected in the Git index for add/copy/modify/rename changes. */
export function stagedFiles(root: string, runner: GitRunner = runGit): string[] {
  return changedFiles(["diff", "--cached", "--name-only", "--diff-filter=ACMR"], root, runner);
}

/** Returns repository-relative paths with unstaged working-tree modifications. */
export function unstagedFiles(root: string, runner: GitRunner = runGit): string[] {
  return changedFiles(["diff", "--name-only", "--diff-filter=ACMR"], root, runner);
}

function changedFiles(arguments_: string[], root: string, runner: GitRunner): string[] {
  try {
    return runner(arguments_, root).split(/\r?\n/).map((path) => path.trim().replace(/\\/g, "/")).filter(Boolean).sort((left, right) => left.localeCompare(right));
  } catch {
    throw new Error("StackBrief could not read Git change data. Run this command inside a Git repository.");
  }
}

function runGit(arguments_: string[], root: string): string {
  return execFileSync("git", arguments_, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}
