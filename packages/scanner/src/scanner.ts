import { join } from "node:path";
import { FileSystem, NodeFileSystem } from "../../core/src";
import { buildRepositoryKnowledge } from "../../knowledge/src";
import { nextAppRoutes } from "./frameworks/nextjs";
import {
  ApiRoute,
  Detection,
  EntryPoint,
  EnvironmentVariable,
  LanguageDetection,
  STACKBRIEF_SCHEMA_VERSION,
  StackbriefReport,
} from "../../types/src";

interface PackageJson {
  name?: string;
  main?: string;
  module?: string;
  bin?: string | Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface ScanOptions {
  root: string;
  fileSystem?: FileSystem;
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript",
  ".mjs": "JavaScript", ".cjs": "JavaScript", ".py": "Python", ".go": "Go",
  ".rs": "Rust", ".java": "Java", ".kt": "Kotlin", ".rb": "Ruby", ".php": "PHP",
  ".cs": "C#", ".swift": "Swift", ".sol": "Solidity",
};

const FRAMEWORKS: Record<string, string> = {
  next: "Next.js", react: "React", vue: "Vue", nuxt: "Nuxt", svelte: "Svelte",
  "@angular/core": "Angular", express: "Express", fastify: "Fastify", koa: "Koa",
  nestjs: "NestJS", "@nestjs/core": "NestJS", django: "Django", flask: "Flask",
  fastapi: "FastAPI", rails: "Ruby on Rails",
};
const DATABASES: Record<string, string> = {
  prisma: "Prisma", "@prisma/client": "Prisma", mongoose: "MongoDB", mongodb: "MongoDB",
  pg: "PostgreSQL", mysql2: "MySQL", sqlite3: "SQLite", "@supabase/supabase-js": "Supabase",
  drizzle: "Drizzle ORM", "drizzle-orm": "Drizzle ORM",
};
const QUEUES: Record<string, string> = {
  bull: "Bull", bullmq: "BullMQ", amqplib: "RabbitMQ", "@aws-sdk/client-sqs": "Amazon SQS",
  kafkajs: "Kafka", "@google-cloud/pubsub": "Google Cloud Pub/Sub",
};
const BUILD_TOOLS: Record<string, string> = {
  vite: "Vite", webpack: "Webpack", esbuild: "esbuild", tsup: "tsup", rollup: "Rollup",
  turbo: "Turborepo", nx: "Nx", "@swc/core": "SWC",
};
const TESTING: Record<string, string> = {
  jest: "Jest", vitest: "Vitest", mocha: "Mocha", ava: "AVA", playwright: "Playwright",
  cypress: "Cypress", "@testing-library/react": "Testing Library",
};

export function scanRepository(options: ScanOptions): StackbriefReport {
  const fileSystem = options.fileSystem ?? new NodeFileSystem();
  const files = fileSystem.listFiles(options.root);
  const texts = new Map<string, string>();
  for (const file of files) {
    if (isTextFile(file)) {
      try { texts.set(file, fileSystem.readText(join(options.root, file))); } catch { /* unreadable files are ignored */ }
    }
  }

  const packageJson = readPackageJson(texts.get("package.json"));
  const dependencies = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
  const sourceFiles = files.filter(isSourceFile);
  const productionTexts = new Map([...texts].filter(([file]) => !isTestFile(file)));

  const inventory = {
    languages: languages(sourceFiles),
    frameworks: dependencyDetections(dependencies, FRAMEWORKS, "package.json"),
    entryPoints: entryPoints(packageJson, files),
    environmentVariables: environmentVariables(productionTexts),
    apis: apiRoutes(productionTexts),
    databases: dependencyDetections(dependencies, DATABASES, "package.json"),
    queues: dependencyDetections(dependencies, QUEUES, "package.json"),
    workers: workers(productionTexts),
    buildTools: dependencyDetections(dependencies, BUILD_TOOLS, "package.json"),
    testingFrameworks: dependencyDetections(dependencies, TESTING, "package.json"),
  };
  const repositoryName = packageJson?.name ?? options.root.split(/[\\/]/).filter(Boolean).pop() ?? "repository";

  return {
    schemaVersion: STACKBRIEF_SCHEMA_VERSION,
    repository: {
      name: repositoryName,
      packageManagers: packageManagers(files),
    },
    inventory,
    knowledge: buildRepositoryKnowledge({ repositoryName, files, texts, inventory }),
  };
}

function packageManagers(files: string[]): Detection[] {
  const signals: Array<[string, string]> = [["package-lock.json", "npm"], ["pnpm-lock.yaml", "pnpm"], ["yarn.lock", "Yarn"], ["bun.lockb", "Bun"], ["bun.lock", "Bun"], ["poetry.lock", "Poetry"], ["Cargo.lock", "Cargo"]];
  return signals.filter(([file]) => files.includes(file)).map(([file, name]) => ({ name, evidence: [{ file }] }));
}

function languages(files: string[]): LanguageDetection[] {
  const matches = new Map<string, string[]>();
  for (const file of files) {
    const extension = Object.keys(LANGUAGE_EXTENSIONS).find((candidate) => file.endsWith(candidate));
    if (extension) {
      const language = LANGUAGE_EXTENSIONS[extension];
      matches.set(language, [...(matches.get(language) ?? []), file]);
    }
  }
  return [...matches.entries()].map(([name, languageFiles]) => ({ name, files: languageFiles.length, evidence: languageFiles.slice(0, 5).map((file) => ({ file })) })).sort(byName);
}

function dependencyDetections(dependencies: Record<string, string> | undefined, catalogue: Record<string, string>, file: string): Detection[] {
  if (!dependencies) return [];
  const output = new Map<string, Detection>();
  for (const dependency of Object.keys(dependencies)) {
    const name = catalogue[dependency];
    if (name && !output.has(name)) output.set(name, { name, evidence: [{ file }] });
  }
  return [...output.values()].sort(byName);
}

function entryPoints(packageJson: PackageJson | undefined, files: string[]): EntryPoint[] {
  if (!packageJson) return [];
  const candidates: Array<[string | undefined, EntryPoint["kind"]]> = [[packageJson.main, "package"], [packageJson.module, "package"]];
  if (typeof packageJson.bin === "string") candidates.push([packageJson.bin, "package"]);
  if (packageJson.bin && typeof packageJson.bin === "object") candidates.push(...Object.values(packageJson.bin).map((path): [string, EntryPoint["kind"]] => [path, "package"]));
  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
    if (/^(start|dev|serve|build)$/i.test(name)) candidates.push([command.split(/\s+/).find((part) => /\.(?:[cm]?[jt]sx?|py|go|rs)$/i.test(part)), "script"]);
  }
  const definedCandidates = candidates.filter((candidate): candidate is [string, EntryPoint["kind"]] => candidate[0] !== undefined);
  return definedCandidates.filter(([path]) => files.includes(path)).map(([path, kind]) => ({ path, kind, evidence: [{ file: "package.json" }] })).filter(uniqueEntryPoint);
}

function environmentVariables(texts: Map<string, string>): EnvironmentVariable[] {
  const result = new Map<string, EnvironmentVariable>();
  for (const [file, text] of texts) {
    const regex = file.startsWith(".env") ? /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm : /(?:process\.env|import\.meta\.env)\.([A-Za-z_][A-Za-z0-9_]*)/g;
    for (const match of text.matchAll(regex)) addEvidence(result, match[1], { file, line: lineNumber(text, match.index ?? 0) });
  }
  return [...result.values()].sort(byName);
}

function apiRoutes(texts: Map<string, string>): ApiRoute[] {
  const routes = new Map<string, ApiRoute>();
  const routePattern = /\b(?:app|router|server)\s*\.\s*(get|post|put|patch|delete|all)\s*\(\s*[`'"]([^`'"]+)/gi;
  for (const [file, text] of texts) {
    for (const match of text.matchAll(routePattern)) {
      const method = match[1].toUpperCase();
      const path = match[2];
      const key = `${method} ${path}`;
      const current = routes.get(key) ?? { path, method, evidence: [] };
      current.evidence.push({ file, line: lineNumber(text, match.index ?? 0) });
      routes.set(key, current);
    }
    for (const route of nextAppRoutes(file, text)) {
      const key = `${route.method ?? "ANY"} ${route.path}`;
      const current = routes.get(key) ?? { path: route.path, method: route.method, framework: route.framework, evidence: [] };
      current.evidence.push(...route.evidence);
      routes.set(key, current);
    }
  }
  return [...routes.values()].sort((left, right) => `${left.method} ${left.path}`.localeCompare(`${right.method} ${right.path}`));
}

function workers(texts: Map<string, string>): Detection[] {
  const detections = new Map<string, Detection>();
  for (const [file, text] of texts) {
    const workerMatch = /new\s+Worker\s*\(/.exec(text);
    if (workerMatch) addEvidence(detections, "Worker threads", { file, line: lineNumber(text, workerMatch.index) });
    const bullMatch = /new\s+(?:Worker|Queue)\s*\(/.exec(text);
    if (bullMatch && /bullmq|bull/.test(text)) addEvidence(detections, "Queue worker", { file, line: lineNumber(text, bullMatch.index) });
  }
  return [...detections.values()].sort(byName);
}

function addEvidence<T extends Detection>(items: Map<string, T>, name: string, evidence: { file: string; line?: number }): void {
  const existing = items.get(name);
  if (existing) {
    existing.evidence.push(evidence);
    return;
  }
  items.set(name, { name, evidence: [evidence] } as unknown as T);
}

function readPackageJson(value: string | undefined): PackageJson | undefined {
  if (!value) return undefined;
  try { return JSON.parse(value) as PackageJson; } catch { return undefined; }
}
function isTextFile(file: string): boolean { return /(^|\/)(?:\.env[^/]*|[^/]+\.(?:[cm]?[jt]sx?|json|ya?ml|toml|py|go|rs|java|kt|rb|php|cs|swift|sol|sql))$/i.test(file); }
function isSourceFile(file: string): boolean { return /\.(?:[cm]?[jt]sx?|py|go|rs|java|kt|rb|php|cs|swift|sol)$/i.test(file); }
function isTestFile(file: string): boolean { return /(?:^|\/)(?:__tests__\/|.*\.(?:test|spec)\.[^/]+$)/i.test(file); }
function lineNumber(text: string, index: number): number { return text.slice(0, index).split("\n").length; }
function byName(left: Detection, right: Detection): number { return left.name.localeCompare(right.name); }
function uniqueEntryPoint(entry: EntryPoint, index: number, values: EntryPoint[]): boolean { return values.findIndex((candidate) => candidate.path === entry.path) === index; }
