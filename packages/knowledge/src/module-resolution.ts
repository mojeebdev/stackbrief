const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"];

interface TypeScriptConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

interface ResolutionConfig {
  directory: string;
  basePath: string;
  paths: Record<string, string[]>;
}

export interface ModuleResolver {
  resolve(sourcePath: string, specifier: string): string | undefined;
}

/** Resolves relative imports and TypeScript/JavaScript path aliases to repository-relative paths. */
export function createModuleResolver(files: readonly string[], texts: ReadonlyMap<string, string>): ModuleResolver {
  const knownFiles = new Set(files);
  const configs = [...texts.entries()].filter(([path]) => /(?:^|\/)(?:tsconfig|jsconfig)\.json$/i.test(path)).map(([path, text]) => parseConfig(path, text)).filter((config): config is ResolutionConfig => Boolean(config)).sort((left, right) => right.directory.length - left.directory.length);

  return {
    resolve(sourcePath, specifier): string | undefined {
      if (specifier.startsWith(".")) return resolveCandidate(normalizePath(`${parentDirectory(sourcePath)}/${specifier}`), knownFiles);
      const config = configs.find((candidate) => candidate.directory === "." || sourcePath.startsWith(`${candidate.directory}/`));
      if (!config) return undefined;
      for (const [pattern, targets] of Object.entries(config.paths)) {
        const wildcard = matchPathPattern(pattern, specifier);
        if (wildcard === undefined) continue;
        for (const target of targets) {
          const candidate = normalizePath(`${config.basePath}/${target.replace("*", wildcard)}`);
          const resolved = resolveCandidate(candidate, knownFiles);
          if (resolved) return resolved;
        }
      }
      return undefined;
    },
  };
}

function parseConfig(path: string, text: string): ResolutionConfig | undefined {
  try {
    const config = JSON.parse(stripJsonComments(text)) as TypeScriptConfig;
    const directory = parentDirectory(path);
    const basePath = normalizePath(`${directory}/${config.compilerOptions?.baseUrl ?? "."}`);
    return { directory, basePath, paths: config.compilerOptions?.paths ?? {} };
  } catch {
    return undefined;
  }
}

function resolveCandidate(base: string, knownFiles: Set<string>): string | undefined {
  const candidates = [base, ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`), ...SOURCE_EXTENSIONS.map((extension) => `${base}/index${extension}`)];
  return candidates.find((candidate) => knownFiles.has(candidate));
}

function matchPathPattern(pattern: string, specifier: string): string | undefined {
  const wildcardIndex = pattern.indexOf("*");
  if (wildcardIndex < 0) return pattern === specifier ? "" : undefined;
  const prefix = pattern.slice(0, wildcardIndex);
  const suffix = pattern.slice(wildcardIndex + 1);
  if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) return undefined;
  return specifier.slice(prefix.length, specifier.length - suffix.length);
}

function stripJsonComments(value: string): string {
  let output = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"' && value[index - 1] !== "\\") quoted = !quoted;
    if (!quoted && character === "/" && value[index + 1] === "/") {
      while (index < value.length && value[index] !== "\n") index += 1;
      output += "\n";
      continue;
    }
    if (!quoted && character === "/" && value[index + 1] === "*") {
      index += 2;
      while (index < value.length && !(value[index] === "*" && value[index + 1] === "/")) index += 1;
      index += 1;
      continue;
    }
    output += character;
  }
  return output.replace(/,\s*([}\]])/g, "$1");
}

function parentDirectory(path: string): string { const index = path.lastIndexOf("/"); return index < 0 ? "." : path.slice(0, index) || "."; }
function normalizePath(path: string): string { const output: string[] = []; for (const segment of path.split("/")) { if (!segment || segment === ".") continue; if (segment === "..") output.pop(); else output.push(segment); } return output.join("/") || "."; }
