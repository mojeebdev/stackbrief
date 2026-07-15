import {
  DependencyNode,
  DirectoryNode,
  ExportNode,
  ExternalApiNode,
  FileNode,
  ImportNode,
  KnowledgeId,
  ProjectNode,
  RepositoryInventory,
  RepositoryKnowledge,
  RouteNode,
  ServiceNode,
  SourceLocation,
} from "../../types/src";
import { createModuleResolver } from "./module-resolution";
import { findOutboundHttpApis } from "./external-api";

interface PackageManifest {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface KnowledgeInput {
  repositoryName: string;
  files: string[];
  texts: ReadonlyMap<string, string>;
  inventory: RepositoryInventory;
}

const API_CLIENTS: Record<string, string> = {
  openai: "OpenAI", "@anthropic-ai/sdk": "Anthropic", stripe: "Stripe", twilio: "Twilio",
  "@sendgrid/mail": "SendGrid", "@aws-sdk/client-s3": "Amazon S3", "@aws-sdk/client-sqs": "Amazon SQS",
};
const DATABASE_PACKAGES: Record<string, string[]> = {
  Prisma: ["prisma", "@prisma/client"], MongoDB: ["mongodb", "mongoose"], PostgreSQL: ["pg"],
  MySQL: ["mysql2"], SQLite: ["sqlite3"], Supabase: ["@supabase/supabase-js"],
  "Drizzle ORM": ["drizzle-orm"],
};

export function buildRepositoryKnowledge(input: KnowledgeInput): RepositoryKnowledge {
  const paths = [...input.files].sort((left, right) => left.localeCompare(right));
  const directories = buildDirectories(paths);
  const manifests = findManifests(input.texts);
  const projects = buildProjects(input.repositoryName, manifests, directories, paths);
  const files = buildFiles(paths, projects);
  const dependencies = buildDependencies(manifests, projects);
  const imports = buildImports(input.texts, files, createModuleResolver(paths, input.texts));
  const exports = buildExports(input.texts, files);
  const { routes, services } = buildServicesAndRoutes(input.inventory, files, projects);
  const databases = input.inventory.databases.map((database) => ({
    id: `database:${slug(database.name)}`,
    name: database.name,
    kind: "detected",
    dependencyIds: dependencies.filter((dependency) => (DATABASE_PACKAGES[database.name] ?? []).includes(dependency.packageName)).map(({ id }) => id),
    evidence: database.evidence,
  }));
  const apis = buildExternalApis(dependencies, input.texts, files);

  return { projects, directories, files, imports, exports, services, routes, databases, apis, dependencies };
}

function buildDirectories(paths: string[]): DirectoryNode[] {
  const evidence = new Map<string, SourceLocation>();
  evidence.set(".", { file: paths[0] ?? "package.json" });
  for (const path of paths) {
    const segments = path.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      const directory = segments.slice(0, index).join("/");
      if (!evidence.has(directory)) evidence.set(directory, { file: path });
    }
  }
  return [...evidence.entries()].map(([path, location]) => ({
    id: directoryId(path), path, parentDirectoryId: path === "." ? undefined : directoryId(parentDirectory(path)), evidence: [location],
  })).sort((left, right) => left.path.localeCompare(right.path));
}

function findManifests(texts: ReadonlyMap<string, string>): Map<string, PackageManifest> {
  const manifests = new Map<string, PackageManifest>();
  for (const [file, text] of texts) {
    if (!file.endsWith("package.json")) continue;
    try { manifests.set(file, JSON.parse(text) as PackageManifest); } catch { /* malformed manifests are represented as files only */ }
  }
  return manifests;
}

function buildProjects(repositoryName: string, manifests: Map<string, PackageManifest>, directories: DirectoryNode[], paths: string[]): ProjectNode[] {
  const projectEntries = manifests.size > 0 ? [...manifests.entries()] : [["", { name: repositoryName }] as [string, PackageManifest]];
  return projectEntries.map(([manifestPath, manifest]) => {
    const rootPath = manifestPath ? parentDirectory(manifestPath) : ".";
    const rootDirectory = directories.find((directory) => directory.path === rootPath) ?? directories[0];
    const id = projectId(rootPath);
    return {
      id,
      name: manifest.name ?? (rootPath === "." ? repositoryName : rootPath.split("/").pop() ?? repositoryName),
      rootDirectoryId: rootDirectory?.id ?? directoryId("."),
      manifestFileId: manifestPath ? fileId(manifestPath) : undefined,
      dependencyIds: [],
      evidence: [{ file: manifestPath || paths[0] || "package.json" }],
    };
  }).sort((left, right) => left.id.localeCompare(right.id));
}

function buildFiles(paths: string[], projects: ProjectNode[]): FileNode[] {
  return paths.map((path) => {
    const directory = parentDirectory(path);
    const project = projectForPath(path, projects);
    return {
      id: fileId(path), path, directoryId: directoryId(directory), projectId: project.id,
      kind: fileKind(path), language: languageFor(path), isTest: isTestFile(path), evidence: [{ file: path }],
    };
  });
}

function buildDependencies(manifests: Map<string, PackageManifest>, projects: ProjectNode[]): DependencyNode[] {
  const dependencies: DependencyNode[] = [];
  for (const [manifestPath, manifest] of manifests) {
    const project = projects.find((candidate) => candidate.id === projectId(parentDirectory(manifestPath)));
    if (!project) continue;
    for (const [scope, collection] of dependencyCollections(manifest)) {
      for (const [packageName, version] of Object.entries(collection)) {
        const id = `dependency:${slug(project.id)}:${scope}:${packageName}`;
        dependencies.push({ id, projectId: project.id, packageName, version, scope, evidence: [{ file: manifestPath }] });
        project.dependencyIds.push(id);
      }
    }
  }
  return dependencies.sort((left, right) => left.id.localeCompare(right.id));
}

function buildImports(texts: ReadonlyMap<string, string>, files: FileNode[], resolver: ReturnType<typeof createModuleResolver>): ImportNode[] {
  const imports: ImportNode[] = [];
  for (const [path, text] of texts) {
    const file = files.find((candidate) => candidate.path === path);
    if (!file || !isCodeFile(path)) continue;
    const patterns: Array<[RegExp, ImportNode["kind"], number, number]> = [
      [/^\s*import\s+(.+?)\s+from\s+["']([^"']+)["']/gm, "static", 2, 1],
      [/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, "require", 1, 0],
      [/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, "dynamic", 1, 0],
    ];
    for (const [pattern, kind, specifierIndex, symbolsIndex] of patterns) {
      for (const match of text.matchAll(pattern)) {
        const specifier = match[specifierIndex];
        const line = lineNumber(text, match.index ?? 0);
        const target = resolveModuleSpecifier(path, specifier, files, resolver);
        imports.push({ id: `import:${file.id}:${line}:${imports.length}`, sourceFileId: file.id, specifier, kind, importedSymbols: symbolsIndex ? importSymbols(match[symbolsIndex]) : [], targetFileId: target?.id, evidence: [{ file: path, line }] });
      }
    }
  }
  return imports.sort((left, right) => left.id.localeCompare(right.id));
}

function buildExports(texts: ReadonlyMap<string, string>, files: FileNode[]): ExportNode[] {
  const exports: ExportNode[] = [];
  const declaration = /^\s*export\s+(default\s+)?(const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm;
  const named = /^\s*export\s*{([^}]+)}/gm;
  for (const [path, text] of texts) {
    const file = files.find((candidate) => candidate.path === path);
    if (!file || !isCodeFile(path)) continue;
    for (const match of text.matchAll(declaration)) {
      const line = lineNumber(text, match.index ?? 0);
      const isDefault = Boolean(match[1]);
      exports.push({ id: `export:${file.id}:${line}:${match[3]}`, fileId: file.id, name: isDefault ? "default" : match[3], kind: match[2], isDefault, evidence: [{ file: path, line }] });
    }
    for (const match of text.matchAll(named)) {
      const line = lineNumber(text, match.index ?? 0);
      for (const name of match[1].split(",").map((part) => part.trim().split(/\s+as\s+/i).pop()).filter((part): part is string => Boolean(part))) {
        exports.push({ id: `export:${file.id}:${line}:${name}`, fileId: file.id, name, kind: "named", isDefault: false, evidence: [{ file: path, line }] });
      }
    }
  }
  return exports.sort((left, right) => left.id.localeCompare(right.id));
}

function buildServicesAndRoutes(inventory: RepositoryInventory, files: FileNode[], projects: ProjectNode[]): { routes: RouteNode[]; services: ServiceNode[] } {
  const routes: RouteNode[] = [];
  const serviceByProject = new Map<KnowledgeId, ServiceNode>();
  for (const apiRoute of inventory.apis) {
    const location = apiRoute.evidence[0];
    const file = files.find((candidate) => candidate.path === location?.file);
    if (!file) continue;
    const service = serviceByProject.get(file.projectId) ?? createHttpService(file.projectId, projects, file);
    serviceByProject.set(file.projectId, service);
    const route: RouteNode = { id: `route:${file.id}:${location.line ?? 0}:${apiRoute.method ?? "ANY"}`, path: apiRoute.path, method: apiRoute.method, ...(apiRoute.framework ? { framework: apiRoute.framework } : {}), serviceId: service.id, fileId: file.id, evidence: apiRoute.evidence };
    routes.push(route);
    service.routeIds.push(route.id);
    if (!service.fileIds.includes(file.id)) service.fileIds.push(file.id);
  }
  for (const worker of inventory.workers) {
    const location = worker.evidence[0];
    const file = files.find((candidate) => candidate.path === location?.file);
    if (!file) continue;
    const id = `service:worker:${file.id}`;
    serviceByProject.set(id, { id, name: worker.name, kind: "worker", projectId: file.projectId, fileIds: [file.id], routeIds: [], evidence: worker.evidence });
  }
  return { routes: routes.sort((left, right) => left.id.localeCompare(right.id)), services: [...serviceByProject.values()].sort((left, right) => left.id.localeCompare(right.id)) };
}

function createHttpService(projectId: KnowledgeId, projects: ProjectNode[], file: FileNode): ServiceNode {
  const project = projects.find((candidate) => candidate.id === projectId);
  return { id: `service:http:${slug(projectId)}`, name: `${project?.name ?? "Repository"} HTTP service`, kind: "http-server", projectId, fileIds: [file.id], routeIds: [], evidence: [{ file: file.path }] };
}

function buildExternalApis(dependencies: DependencyNode[], texts: ReadonlyMap<string, string>, files: FileNode[]): ExternalApiNode[] {
  const apis = new Map<string, ExternalApiNode>();
  for (const dependency of dependencies) {
    const name = API_CLIENTS[dependency.packageName];
    if (!name) continue;
    const key = `${dependency.projectId}:${name.toLowerCase()}`;
    apis.set(key, { id: `api:${slug(dependency.projectId)}:${slug(dependency.packageName)}`, name, kind: "external", dependencyIds: [dependency.id], evidence: [...dependency.evidence] });
  }
  for (const outbound of findOutboundHttpApis(texts, files)) {
    const key = `${outbound.projectId}:${outbound.name.toLowerCase()}`;
    const existing = apis.get(key);
    if (existing) {
      existing.kind = "http-client";
      existing.adapterFileIds = uniqueIds([...(existing.adapterFileIds ?? []), outbound.adapterFileId]);
      existing.evidence.push(...outbound.evidence);
      continue;
    }
    apis.set(key, {
      id: `api:${slug(outbound.projectId)}:${slug(outbound.name.toLowerCase())}`,
      name: outbound.name,
      kind: "http-client",
      dependencyIds: [],
      adapterFileIds: [outbound.adapterFileId],
      evidence: [...outbound.evidence],
    });
  }
  return [...apis.values()].map((api) => ({ ...api, evidence: uniqueEvidence(api.evidence), ...(api.adapterFileIds ? { adapterFileIds: uniqueIds(api.adapterFileIds) } : {}) })).sort((left, right) => left.id.localeCompare(right.id));
}

function dependencyCollections(manifest: PackageManifest): Array<[DependencyNode["scope"], Record<string, string>]> {
  return [["runtime", manifest.dependencies ?? {}], ["development", manifest.devDependencies ?? {}], ["peer", manifest.peerDependencies ?? {}], ["optional", manifest.optionalDependencies ?? {}]];
}
function projectForPath(path: string, projects: ProjectNode[]): ProjectNode { return [...projects].sort((left, right) => right.rootDirectoryId.length - left.rootDirectoryId.length).find((project) => project.rootDirectoryId === directoryId(".") || path.startsWith(`${project.rootDirectoryId.replace("directory:", "")}/`)) ?? projects[0]; }
function resolveModuleSpecifier(sourcePath: string, specifier: string, files: FileNode[], resolver: ReturnType<typeof createModuleResolver>): FileNode | undefined { const path = resolver.resolve(sourcePath, specifier); return path ? files.find((file) => file.path === path) : undefined; }
function importSymbols(value: string): string[] { return value.replace(/[{}]/g, "").split(",").map((part) => part.trim().split(/\s+as\s+/i)[0]).filter(Boolean); }
function directoryId(path: string): KnowledgeId { return `directory:${path}`; }
function projectId(path: string): KnowledgeId { return `project:${path === "." ? "root" : path}`; }
function fileId(path: string): KnowledgeId { return `file:${path}`; }
function parentDirectory(path: string): string { const index = path.lastIndexOf("/"); return index < 0 ? "." : path.slice(0, index) || "."; }
function normalizePath(path: string): string { const output: string[] = []; for (const segment of path.split("/")) { if (!segment || segment === ".") continue; if (segment === "..") output.pop(); else output.push(segment); } return output.join("/"); }
function languageFor(path: string): string | undefined { if (/\.[cm]?[jt]sx?$/i.test(path)) return path.endsWith(".ts") || path.endsWith(".tsx") ? "TypeScript" : "JavaScript"; if (path.endsWith(".py")) return "Python"; if (path.endsWith(".go")) return "Go"; return undefined; }
function fileKind(path: string): string { if (path.endsWith("package.json")) return "manifest"; if (isCodeFile(path)) return "source"; if (/\.(json|ya?ml|toml)$/i.test(path) || path.startsWith(".env")) return "configuration"; return "other"; }
function isCodeFile(path: string): boolean { return /\.[cm]?[jt]sx?$/i.test(path); }
function isTestFile(path: string): boolean { return /(?:^|\/)(?:__tests__\/|.*\.(?:test|spec)\.[^/]+$)/i.test(path); }
function lineNumber(text: string, index: number): number { return text.slice(0, index).split("\n").length; }
function slug(value: string): string { return value.replace(/[^A-Za-z0-9._-]/g, "_"); }
function uniqueIds(values: KnowledgeId[]): KnowledgeId[] { return [...new Set(values)].sort(); }
function uniqueEvidence(values: SourceLocation[]): SourceLocation[] { return [...new Map(values.map((value) => [`${value.file}:${value.line ?? ""}`, value])).values()].sort((left, right) => `${left.file}:${left.line ?? 0}`.localeCompare(`${right.file}:${right.line ?? 0}`)); }
