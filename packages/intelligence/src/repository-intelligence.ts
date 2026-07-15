import {
  DatabaseNode,
  DependencyNode,
  DirectoryNode,
  ExportNode,
  ExternalApiNode,
  FileNode,
  ImportNode,
  KnowledgeId,
  ProjectNode,
  RouteNode,
  ServiceNode,
  SourceLocation,
  STACKBRIEF_SCHEMA_VERSION,
  StackbriefReport,
} from "../../types/src";

export interface ImportTrace {
  rootFileId: KnowledgeId;
  fileIds: KnowledgeId[];
  importIds: KnowledgeId[];
}

export interface ExportTrace {
  fileId: KnowledgeId;
  exportIds: KnowledgeId[];
}

export interface DependencyTrace extends ImportTrace {
  dependencyIds: KnowledgeId[];
}

export type SearchResultKind = "project" | "directory" | "file" | "service" | "route" | "database" | "api" | "dependency";

export interface SearchResult {
  id: KnowledgeId;
  kind: SearchResultKind;
  score: number;
  evidence: SourceLocation[];
}

export interface RepositoryIntelligenceQuery {
  findProject(id: KnowledgeId): ProjectNode | undefined;
  findDirectory(path: string): DirectoryNode | undefined;
  findFile(path: string): FileNode | undefined;
  findFilesByLanguage(language: string): FileNode[];
  findEntryPoints(): FileNode[];
  findRoutes(): RouteNode[];
  findService(name: string): ServiceNode | undefined;
  findDatabase(name: string): DatabaseNode | undefined;
  findExternalApi(name: string): ExternalApiNode | undefined;
  findDependencies(): DependencyNode[];
  findDependents(file: KnowledgeId | string): FileNode[];
  traceImports(file: KnowledgeId | string): ImportTrace | undefined;
  traceExports(file: KnowledgeId | string): ExportTrace | undefined;
  traceDependency(file: KnowledgeId | string): DependencyTrace | undefined;
  search(text: string): SearchResult[];
  refresh(report: StackbriefReport): void;
}

interface SearchEntry {
  id: KnowledgeId;
  kind: SearchResultKind;
  text: string;
  evidence: SourceLocation[];
}

interface IndexState {
  projectsById: Map<KnowledgeId, ProjectNode>;
  directoriesByPath: Map<string, DirectoryNode>;
  filesById: Map<KnowledgeId, FileNode>;
  filesByPath: Map<string, FileNode>;
  filesByLanguage: Map<string, FileNode[]>;
  importsBySourceFile: Map<KnowledgeId, ImportNode[]>;
  importsByTargetFile: Map<KnowledgeId, ImportNode[]>;
  exportsByFile: Map<KnowledgeId, ExportNode[]>;
  servicesByName: Map<string, ServiceNode[]>;
  databasesByName: Map<string, DatabaseNode[]>;
  apisByName: Map<string, ExternalApiNode[]>;
  dependencies: DependencyNode[];
  dependenciesByProjectPackage: Map<string, DependencyNode>;
  entryPointFileIds: KnowledgeId[];
  routes: RouteNode[];
  searchEntries: SearchEntry[];
}

/**
 * Read-only repository query engine backed by the canonical stackbrief.json model.
 * Calling refresh replaces its indexes atomically after a new report is available.
 */
export class RepositoryIntelligence implements RepositoryIntelligenceQuery {
  private state: IndexState;

  public constructor(report: StackbriefReport) {
    this.state = buildIndex(report);
  }

  public refresh(report: StackbriefReport): void {
    this.state = buildIndex(report);
  }

  public findProject(id: KnowledgeId): ProjectNode | undefined { return this.state.projectsById.get(id); }
  public findDirectory(path: string): DirectoryNode | undefined { return this.state.directoriesByPath.get(normalizePath(path)); }
  public findFile(path: string): FileNode | undefined { return this.state.filesByPath.get(normalizePath(path)); }
  public findFilesByLanguage(language: string): FileNode[] { return [...(this.state.filesByLanguage.get(normalizeName(language)) ?? [])]; }
  public findEntryPoints(): FileNode[] { return this.state.entryPointFileIds.map((id) => this.state.filesById.get(id)).filter((file): file is FileNode => Boolean(file)); }
  public findRoutes(): RouteNode[] { return [...this.state.routes]; }
  public findService(name: string): ServiceNode | undefined { return this.state.servicesByName.get(normalizeName(name))?.[0]; }
  public findDatabase(name: string): DatabaseNode | undefined { return this.state.databasesByName.get(normalizeName(name))?.[0]; }
  public findExternalApi(name: string): ExternalApiNode | undefined { return this.state.apisByName.get(normalizeName(name))?.[0]; }
  public findDependencies(): DependencyNode[] { return [...this.state.dependencies]; }

  public findDependents(file: KnowledgeId | string): FileNode[] {
    const target = this.resolveFile(file);
    if (!target) return [];
    return uniqueFiles((this.state.importsByTargetFile.get(target.id) ?? []).map((item) => this.state.filesById.get(item.sourceFileId)).filter((item): item is FileNode => Boolean(item)));
  }

  public traceImports(file: KnowledgeId | string): ImportTrace | undefined {
    const root = this.resolveFile(file);
    if (!root) return undefined;
    const traversal = walkFileGraph(root.id, (fileId) => this.state.importsBySourceFile.get(fileId) ?? []);
    return { rootFileId: root.id, fileIds: traversal.fileIds, importIds: traversal.importIds };
  }

  public traceExports(file: KnowledgeId | string): ExportTrace | undefined {
    const target = this.resolveFile(file);
    if (!target) return undefined;
    return { fileId: target.id, exportIds: (this.state.exportsByFile.get(target.id) ?? []).map(({ id }) => id) };
  }

  public traceDependency(file: KnowledgeId | string): DependencyTrace | undefined {
    const root = this.resolveFile(file);
    if (!root) return undefined;
    const traversal = walkFileGraph(root.id, (fileId) => this.state.importsBySourceFile.get(fileId) ?? []);
    const dependencyIds = new Set<KnowledgeId>();
    for (const importId of traversal.importIds) {
      const imported = traversal.importsById.get(importId);
      if (!imported || imported.targetFileId) continue;
      const source = this.state.filesById.get(imported.sourceFileId);
      if (!source) continue;
      const dependency = this.state.dependenciesByProjectPackage.get(dependencyKey(source.projectId, packageNameFromSpecifier(imported.specifier)));
      if (dependency) dependencyIds.add(dependency.id);
    }
    return { rootFileId: root.id, fileIds: traversal.fileIds, importIds: traversal.importIds, dependencyIds: [...dependencyIds].sort() };
  }

  public search(text: string): SearchResult[] {
    const terms = normalizeName(text).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return this.state.searchEntries.map((entry) => ({ entry, score: score(entry.text, terms) })).filter(({ score: value }) => value > 0).sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id)).map(({ entry, score: value }) => ({ id: entry.id, kind: entry.kind, score: value, evidence: entry.evidence }));
  }

  private resolveFile(file: KnowledgeId | string): FileNode | undefined {
    return this.state.filesById.get(file) ?? this.findFile(file);
  }
}

export function createRepositoryIntelligence(report: StackbriefReport): RepositoryIntelligence {
  return new RepositoryIntelligence(report);
}

function buildIndex(report: StackbriefReport): IndexState {
  if (report.schemaVersion !== STACKBRIEF_SCHEMA_VERSION) {
    throw new Error(`Unsupported StackBrief schema version: ${String(report.schemaVersion)}.`);
  }
  const { knowledge } = report;
  const projectsById = new Map(knowledge.projects.map((node) => [node.id, node]));
  const directoriesByPath = new Map(knowledge.directories.map((node) => [normalizePath(node.path), node]));
  const filesById = new Map(knowledge.files.map((node) => [node.id, node]));
  const filesByPath = new Map(knowledge.files.map((node) => [normalizePath(node.path), node]));
  const filesByLanguage = groupBy(knowledge.files.filter((node): node is FileNode & { language: string } => Boolean(node.language)), (node) => normalizeName(node.language));
  const importsBySourceFile = groupBy(knowledge.imports, (node) => node.sourceFileId);
  const importsByTargetFile = groupBy(knowledge.imports.filter((node): node is ImportNode & { targetFileId: KnowledgeId } => Boolean(node.targetFileId)), (node) => node.targetFileId);
  const exportsByFile = groupBy(knowledge.exports, (node) => node.fileId);
  const servicesByName = groupBy(knowledge.services, (node) => normalizeName(node.name));
  const databasesByName = groupBy(knowledge.databases, (node) => normalizeName(node.name));
  const apisByName = groupBy(knowledge.apis, (node) => normalizeName(node.name));
  const dependencies = [...knowledge.dependencies].sort((left, right) => left.id.localeCompare(right.id));
  const dependenciesByProjectPackage = new Map(dependencies.map((node) => [dependencyKey(node.projectId, node.packageName), node]));
  const entryPointFileIds = report.inventory.entryPoints.map(({ path }) => filesByPath.get(normalizePath(path))?.id).filter((id): id is KnowledgeId => Boolean(id));

  return {
    projectsById, directoriesByPath, filesById, filesByPath, filesByLanguage, importsBySourceFile, importsByTargetFile, exportsByFile,
    servicesByName, databasesByName, apisByName, dependencies, dependenciesByProjectPackage, entryPointFileIds,
    routes: [...knowledge.routes].sort((left, right) => left.id.localeCompare(right.id)),
    searchEntries: buildSearchEntries(knowledge.projects, knowledge.directories, knowledge.files, knowledge.services, knowledge.routes, knowledge.databases, knowledge.apis, dependencies),
  };
}

function walkFileGraph(rootFileId: KnowledgeId, next: (fileId: KnowledgeId) => ImportNode[]): { fileIds: KnowledgeId[]; importIds: KnowledgeId[]; importsById: Map<KnowledgeId, ImportNode> } {
  const visitedFiles = new Set<KnowledgeId>([rootFileId]);
  const visitedImports = new Map<KnowledgeId, ImportNode>();
  const queue: KnowledgeId[] = [rootFileId];
  for (let index = 0; index < queue.length; index += 1) {
    for (const imported of next(queue[index])) {
      visitedImports.set(imported.id, imported);
      if (imported.targetFileId && !visitedFiles.has(imported.targetFileId)) {
        visitedFiles.add(imported.targetFileId);
        queue.push(imported.targetFileId);
      }
    }
  }
  return { fileIds: [...visitedFiles], importIds: [...visitedImports.keys()].sort(), importsById: visitedImports };
}

function buildSearchEntries(projects: ProjectNode[], directories: DirectoryNode[], files: FileNode[], services: ServiceNode[], routes: RouteNode[], databases: DatabaseNode[], apis: ExternalApiNode[], dependencies: DependencyNode[]): SearchEntry[] {
  return [
    ...projects.map((node) => searchEntry(node.id, "project", node.name, node.evidence)),
    ...directories.map((node) => searchEntry(node.id, "directory", node.path, node.evidence)),
    ...files.map((node) => searchEntry(node.id, "file", `${node.path} ${node.language ?? ""} ${node.kind}`, node.evidence)),
    ...services.map((node) => searchEntry(node.id, "service", `${node.name} ${node.kind}`, node.evidence)),
    ...routes.map((node) => searchEntry(node.id, "route", `${node.method ?? ""} ${node.path}`, node.evidence)),
    ...databases.map((node) => searchEntry(node.id, "database", `${node.name} ${node.kind}`, node.evidence)),
    ...apis.map((node) => searchEntry(node.id, "api", `${node.name} ${node.kind}`, node.evidence)),
    ...dependencies.map((node) => searchEntry(node.id, "dependency", `${node.packageName} ${node.version} ${node.scope}`, node.evidence)),
  ].sort((left, right) => left.id.localeCompare(right.id));
}

function searchEntry(id: KnowledgeId, kind: SearchResultKind, text: string, evidence: SourceLocation[]): SearchEntry { return { id, kind, text: normalizeName(text), evidence }; }
function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> { const groups = new Map<string, T[]>(); for (const item of items) { const groupKey = key(item); const group = groups.get(groupKey); if (group) group.push(item); else groups.set(groupKey, [item]); } for (const itemsForKey of groups.values()) itemsForKey.sort((left, right) => (left as { id: string }).id.localeCompare((right as { id: string }).id)); return groups; }
function uniqueFiles(files: FileNode[]): FileNode[] { return [...new Map(files.map((file) => [file.id, file])).values()].sort((left, right) => left.id.localeCompare(right.id)); }
function dependencyKey(projectId: KnowledgeId, packageName: string): string { return `${projectId}:${packageName}`; }
function packageNameFromSpecifier(specifier: string): string { if (!specifier.startsWith("@")) return specifier.split("/")[0]; return specifier.split("/").slice(0, 2).join("/"); }
function normalizeName(value: string): string { return value.trim().toLocaleLowerCase(); }
function normalizePath(value: string): string { return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "") || "."; }
function score(value: string, terms: string[]): number { if (!terms.every((term) => value.includes(term))) return 0; return terms.reduce((total, term) => total + (value === term ? 10 : value.startsWith(term) ? 5 : 1), 0); }
