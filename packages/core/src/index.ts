import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export { stagedFiles, unstagedFiles } from "./git";
export type { GitRunner } from "./git";

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "coverage",
  "dist",
  "build",
  ".next",
  ".turbo",
]);

export interface FileSystem {
  listFiles(root: string): string[];
  readText(file: string): string;
}

export class NodeFileSystem implements FileSystem {
  public listFiles(root: string): string[] {
    const files: string[] = [];
    const visit = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (!DEFAULT_IGNORED_DIRECTORIES.has(entry.name)) {
            visit(join(directory, entry.name));
          }
        } else if (entry.isFile()) {
          files.push(relative(root, join(directory, entry.name)).split(sep).join("/"));
        }
      }
    };
    visit(root);
    return files.sort((left, right) => left.localeCompare(right));
  }

  public readText(file: string): string {
    return readFileSync(file, "utf8");
  }
}

export function fileExists(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
