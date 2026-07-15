export const STACKBRIEF_SCHEMA_VERSION = 2 as const;

export interface SourceLocation {
  file: string;
  line?: number;
}

export interface Detection {
  name: string;
  evidence: SourceLocation[];
}

export interface LanguageDetection extends Detection {
  files: number;
}

export interface EntryPoint {
  path: string;
  kind: "package" | "source" | "script";
  evidence: SourceLocation[];
}

export interface EnvironmentVariable {
  name: string;
  evidence: SourceLocation[];
}

export interface ApiRoute {
  path: string;
  method?: string;
  framework?: string;
  evidence: SourceLocation[];
}

/** A stable, repository-local identifier such as `file:src/server.ts`. */
export type KnowledgeId = string;

export interface KnowledgeNode {
  id: KnowledgeId;
  evidence: SourceLocation[];
}

export interface ProjectNode extends KnowledgeNode {
  name: string;
  rootDirectoryId: KnowledgeId;
  manifestFileId?: KnowledgeId;
  dependencyIds: KnowledgeId[];
}

export interface DirectoryNode extends KnowledgeNode {
  path: string;
  parentDirectoryId?: KnowledgeId;
}

export interface FileNode extends KnowledgeNode {
  path: string;
  directoryId: KnowledgeId;
  kind: string;
  language?: string;
  projectId: KnowledgeId;
  isTest: boolean;
}

export interface ImportNode extends KnowledgeNode {
  sourceFileId: KnowledgeId;
  specifier: string;
  kind: "static" | "dynamic" | "require";
  importedSymbols: string[];
  targetFileId?: KnowledgeId;
}

export interface ExportNode extends KnowledgeNode {
  fileId: KnowledgeId;
  name: string;
  kind: string;
  isDefault: boolean;
}

export interface ServiceNode extends KnowledgeNode {
  name: string;
  kind: string;
  projectId: KnowledgeId;
  fileIds: KnowledgeId[];
  routeIds: KnowledgeId[];
}

export interface RouteNode extends KnowledgeNode {
  path: string;
  method?: string;
  framework?: string;
  serviceId?: KnowledgeId;
  fileId: KnowledgeId;
}

export interface DatabaseNode extends KnowledgeNode {
  name: string;
  kind: string;
  dependencyIds: KnowledgeId[];
}

export interface ExternalApiNode extends KnowledgeNode {
  name: string;
  kind: string;
  dependencyIds: KnowledgeId[];
  /** Source files that implement a statically observed outbound provider adapter. */
  adapterFileIds?: KnowledgeId[];
}

export interface DependencyNode extends KnowledgeNode {
  projectId: KnowledgeId;
  packageName: string;
  version: string;
  scope: "runtime" | "development" | "peer" | "optional";
}

export interface RepositoryKnowledge {
  projects: ProjectNode[];
  directories: DirectoryNode[];
  files: FileNode[];
  imports: ImportNode[];
  exports: ExportNode[];
  services: ServiceNode[];
  routes: RouteNode[];
  databases: DatabaseNode[];
  apis: ExternalApiNode[];
  dependencies: DependencyNode[];
}

export interface RepositoryIdentity {
  name: string;
  packageManagers: Detection[];
}

export interface RepositoryInventory {
  languages: LanguageDetection[];
  frameworks: Detection[];
  entryPoints: EntryPoint[];
  environmentVariables: EnvironmentVariable[];
  apis: ApiRoute[];
  databases: Detection[];
  queues: Detection[];
  workers: Detection[];
  buildTools: Detection[];
  testingFrameworks: Detection[];
}

export interface StackbriefReport {
  schemaVersion: typeof STACKBRIEF_SCHEMA_VERSION;
  repository: RepositoryIdentity;
  inventory: RepositoryInventory;
  knowledge: RepositoryKnowledge;
}
