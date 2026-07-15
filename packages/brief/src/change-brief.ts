import { createRepositoryIntelligence } from "../../intelligence/src";
import {
  DatabaseNode,
  ExternalApiNode,
  FileNode,
  KnowledgeId,
  KnowledgeNode,
  RouteNode,
  ServiceNode,
  SourceLocation,
  StackbriefReport,
} from "../../types/src";

export interface BriefEntity {
  id: KnowledgeId;
  label: string;
  evidence: SourceLocation[];
}

export interface BriefFact {
  statement: string;
  evidence: SourceLocation[];
}

export interface ChangeBrief {
  version: 1;
  startingPoint: BriefEntity;
  relevantArchitecture: {
    routes: BriefEntity[];
    services: BriefEntity[];
    databases: BriefEntity[];
    externalApis: BriefEntity[];
  };
  impact: {
    directDependents: BriefEntity[];
    tracedFiles: BriefEntity[];
  };
  observedConstraints: BriefFact[];
  unknowns: BriefFact[];
  validationTargets: BriefEntity[];
  evidence: SourceLocation[];
}

export interface StagedChangeBrief {
  version: 1;
  changedFiles: BriefEntity[];
  relevantArchitecture: ChangeBrief["relevantArchitecture"];
  impact: ChangeBrief["impact"];
  observedConstraints: BriefFact[];
  unknowns: BriefFact[];
  validationTargets: BriefEntity[];
  evidence: SourceLocation[];
}

/** Builds a deterministic, static pre-change brief for one canonical repository file. */
export function createFileChangeBrief(report: StackbriefReport, path: string): ChangeBrief | undefined {
  const intelligence = createRepositoryIntelligence(report);
  const file = intelligence.findFile(path);
  if (!file) return undefined;

  const importTrace = intelligence.traceImports(file.id);
  const dependencyTrace = intelligence.traceDependency(file.id);
  if (!importTrace || !dependencyTrace) return undefined;

  const tracedFileIds = new Set(importTrace.fileIds);
  const tracedFiles = report.knowledge.files.filter((candidate) => tracedFileIds.has(candidate.id));
  const routes = report.knowledge.routes.filter((route) => tracedFileIds.has(route.fileId));
  const routeServiceIds = new Set(routes.map(({ serviceId }) => serviceId).filter((id): id is KnowledgeId => Boolean(id)));
  const services = report.knowledge.services.filter((service) => routeServiceIds.has(service.id) || service.fileIds.some((fileId) => tracedFileIds.has(fileId)));
  const dependencyIds = new Set(dependencyTrace.dependencyIds);
  const databases = report.knowledge.databases.filter((database) => database.dependencyIds.some((id) => dependencyIds.has(id)));
  const directDependents = intelligence.findDependents(file.id);
  const validationTargets = findTestTargets(intelligence, tracedFiles);
  const importsById = new Map(report.knowledge.imports.map((item) => [item.id, item]));
  const dependenciesById = new Map(report.knowledge.dependencies.map((item) => [item.id, item]));

  const externalApis = report.knowledge.apis.filter((api) => api.dependencyIds.some((id) => dependencyIds.has(id)) || api.adapterFileIds?.some((id) => tracedFileIds.has(id)));
  const filesById = new Map(report.knowledge.files.map((candidate) => [candidate.id, candidate]));
  const serviceEntities = services.map((service) => entity(service, service.name, routeEvidenceForService(service, routes)));
  const externalApiEntities = externalApis.map((api) => {
    const adapter = api.adapterFileIds?.map((id) => filesById.get(id)?.path).find(Boolean);
    return entity(api, adapter ? `${api.name} via ${adapter}` : api.name);
  });
  const observedConstraints = buildConstraints(file, routes, services, databases, externalApis, directDependents);
  const unknowns = buildUnknowns(file, importTrace.importIds.map((id) => importsById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item)), dependencyIds, dependenciesById, validationTargets);
  const brief: ChangeBrief = {
    version: 1,
    startingPoint: entity(file, file.path),
    relevantArchitecture: {
      routes: routes.map(routeEntity),
      services: serviceEntities,
      databases: databases.map((database) => entity(database, database.name)),
      externalApis: externalApiEntities,
    },
    impact: {
      directDependents: directDependents.map((dependent) => entity(dependent, dependent.path)),
      tracedFiles: tracedFiles.filter((candidate) => candidate.id !== file.id).map((candidate) => entity(candidate, candidate.path)),
    },
    observedConstraints,
    unknowns,
    validationTargets: validationTargets.map((target) => entity(target, target.path)),
    evidence: uniqueEvidence([
      file.evidence, ...routes.map(({ evidence }) => evidence), ...serviceEntities.map(({ evidence }) => evidence),
      ...databases.map(({ evidence }) => evidence), ...externalApis.map(({ evidence }) => evidence),
      ...directDependents.map(({ evidence }) => evidence), ...validationTargets.map(({ evidence }) => evidence),
      ...observedConstraints.map(({ evidence }) => evidence), ...unknowns.map(({ evidence }) => evidence),
    ].flat()),
  };
  return brief;
}

/** Merges canonical file briefs for a staged Git change into one deterministic review brief. */
export function createStagedChangeBrief(report: StackbriefReport, paths: string[]): StagedChangeBrief | undefined {
  const fileBriefs = [...new Set(paths)].sort((left, right) => left.localeCompare(right)).map((path) => createFileChangeBrief(report, path)).filter((brief): brief is ChangeBrief => Boolean(brief));
  if (fileBriefs.length === 0) return undefined;
  return {
    version: 1,
    changedFiles: mergeEntities(fileBriefs.map(({ startingPoint }) => [startingPoint]).flat()),
    relevantArchitecture: {
      routes: mergeEntities(fileBriefs.map((brief) => brief.relevantArchitecture.routes).flat()),
      services: mergeEntities(fileBriefs.map((brief) => brief.relevantArchitecture.services).flat()),
      databases: mergeEntities(fileBriefs.map((brief) => brief.relevantArchitecture.databases).flat()),
      externalApis: mergeEntities(fileBriefs.map((brief) => brief.relevantArchitecture.externalApis).flat()),
    },
    impact: {
      directDependents: mergeEntities(fileBriefs.map((brief) => brief.impact.directDependents).flat()),
      tracedFiles: mergeEntities(fileBriefs.map((brief) => brief.impact.tracedFiles).flat()),
    },
    observedConstraints: uniqueFacts(fileBriefs.map((brief) => brief.observedConstraints).flat()),
    unknowns: uniqueFacts(fileBriefs.map((brief) => brief.unknowns).flat()),
    validationTargets: mergeEntities(fileBriefs.map((brief) => brief.validationTargets).flat()),
    evidence: uniqueEvidence(fileBriefs.map((brief) => brief.evidence).flat()),
  };
}

export function renderChangeBrief(brief: ChangeBrief): string {
  return [
    `StackBrief: ${brief.startingPoint.label}`,
    "",
    section("Starting point", [formatEntity(brief.startingPoint)]),
    section("Relevant architecture", [
      ...formatGroup("Routes", brief.relevantArchitecture.routes),
      ...formatGroup("Services", brief.relevantArchitecture.services),
      ...formatGroup("Databases", brief.relevantArchitecture.databases),
      ...formatGroup("External APIs", brief.relevantArchitecture.externalApis),
    ]),
    section("Likely impact", [
      ...formatGroup("Direct dependents", brief.impact.directDependents),
      ...formatGroup("Traced local files", brief.impact.tracedFiles),
    ]),
    section("Observed constraints", brief.observedConstraints.map(({ statement, evidence }) => `- ${statement} (${formatEvidence(evidence[0])})`)),
    section("Unknowns", brief.unknowns.map(({ statement, evidence }) => `- ${statement} (${formatEvidence(evidence[0])})`)),
    section("Validation targets", brief.validationTargets.map(formatEntity)),
    section("Evidence", brief.evidence.slice(0, 16).map((location) => `- ${formatEvidence(location)}`)),
  ].filter(Boolean).join("\n");
}

export function renderStagedChangeBrief(brief: StagedChangeBrief): string {
  return [
    `StackBrief: staged change (${brief.changedFiles.length} file${brief.changedFiles.length === 1 ? "" : "s"})`,
    "",
    section("Changed files", brief.changedFiles.map(formatEntity)),
    section("Relevant architecture", [
      ...formatGroup("Routes", brief.relevantArchitecture.routes),
      ...formatGroup("Services", brief.relevantArchitecture.services),
      ...formatGroup("Databases", brief.relevantArchitecture.databases),
      ...formatGroup("External APIs", brief.relevantArchitecture.externalApis),
    ]),
    section("Likely impact", [
      ...formatGroup("Direct dependents", brief.impact.directDependents),
      ...formatGroup("Traced local files", brief.impact.tracedFiles),
    ]),
    section("Observed constraints", brief.observedConstraints.map(({ statement, evidence }) => `- ${statement} (${formatEvidence(evidence[0])})`)),
    section("Unknowns", brief.unknowns.map(({ statement, evidence }) => `- ${statement} (${formatEvidence(evidence[0])})`)),
    section("Validation targets", brief.validationTargets.map(formatEntity)),
    section("Evidence", brief.evidence.slice(0, 16).map((location) => `- ${formatEvidence(location)}`)),
  ].filter(Boolean).join("\n");
}

function findTestTargets(intelligence: ReturnType<typeof createRepositoryIntelligence>, files: FileNode[]): FileNode[] {
  const tests = new Map<KnowledgeId, FileNode>();
  for (const file of files) {
    for (const dependent of intelligence.findDependents(file.id)) {
      if (dependent.isTest) tests.set(dependent.id, dependent);
    }
  }
  return [...tests.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function buildConstraints(file: FileNode, routes: RouteNode[], services: ServiceNode[], databases: DatabaseNode[], externalApis: ExternalApiNode[], dependents: FileNode[]): BriefFact[] {
  const constraints: BriefFact[] = [];
  if (routes.length > 0) constraints.push({ statement: `This change is on an exposed route: ${routes.map(routeLabel).join(", ")}.`, evidence: routes.flatMap(({ evidence }) => evidence) });
  if (services.length > 0) constraints.push({ statement: `The traced path belongs to service boundary: ${services.map(({ name }) => name).join(", ")}.`, evidence: services.flatMap((service) => routeEvidenceForService(service, routes)) });
  if (databases.length > 0) constraints.push({ statement: `The traced path includes database integration: ${databases.map(({ name }) => name).join(", ")}.`, evidence: databases.flatMap(({ evidence }) => evidence) });
  if (externalApis.length > 0) constraints.push({ statement: `The traced path includes external API integration: ${externalApis.map(({ name }) => name).join(", ")}.`, evidence: externalApis.flatMap(({ evidence }) => evidence) });
  if (dependents.length > 0) constraints.push({ statement: `${dependents.length} direct local file${dependents.length === 1 ? " depends" : "s depend"} on this starting point.`, evidence: [file.evidence[0], ...dependents.flatMap(({ evidence }) => evidence)] });
  return constraints;
}

function buildUnknowns(file: FileNode, imports: Array<{ specifier: string; kind: string; targetFileId?: KnowledgeId; evidence: SourceLocation[] }>, dependencyIds: Set<KnowledgeId>, dependenciesById: Map<KnowledgeId, { packageName: string }>, validationTargets: FileNode[]): BriefFact[] {
  const unknowns: BriefFact[] = [];
  for (const imported of imports) {
    if (imported.kind === "dynamic") unknowns.push({ statement: `Dynamic import \`${imported.specifier}\` requires runtime verification.`, evidence: imported.evidence });
    if (!imported.targetFileId && !isPlatformImport(imported.specifier) && !hasDependency(imported.specifier, dependencyIds, dependenciesById)) unknowns.push({ statement: `Import \`${imported.specifier}\` was not resolved to a local file or declared dependency.`, evidence: imported.evidence });
  }
  if (file.kind === "source" && validationTargets.length === 0) unknowns.push({ statement: "No directly connected test file was detected; this is not proof of missing coverage.", evidence: file.evidence });
  unknowns.push({ statement: "This is a static brief; verify runtime configuration, feature flags, and production traffic separately.", evidence: file.evidence });
  return uniqueFacts(unknowns);
}

function hasDependency(specifier: string, dependencyIds: Set<KnowledgeId>, dependenciesById: Map<KnowledgeId, { packageName: string }>): boolean {
  const packageName = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
  return [...dependencyIds].some((id) => dependenciesById.get(id)?.packageName === packageName);
}
function isPlatformImport(specifier: string): boolean { return specifier.startsWith("node:"); }

function entity(node: KnowledgeNode, label: string, evidence: SourceLocation[] = node.evidence): BriefEntity { return { id: node.id, label, evidence }; }
function routeEvidenceForService(service: ServiceNode, routes: RouteNode[]): SourceLocation[] { const evidence = routes.filter((route) => route.serviceId === service.id).flatMap(({ evidence }) => evidence); return evidence.length > 0 ? evidence : service.evidence; }
function routeEntity(route: RouteNode): BriefEntity { return entity(route, routeLabel(route)); }
function routeLabel(route: RouteNode): string { return `${route.method ?? "ANY"} ${route.path}`; }
function section(title: string, lines: string[]): string { return lines.length === 0 ? "" : `${title}\n${lines.join("\n")}\n`; }
function formatGroup(label: string, items: BriefEntity[]): string[] { return items.length === 0 ? [] : [`${label}:`, ...items.map((item) => `  ${formatEntity(item)}`)]; }
function formatEntity(item: BriefEntity): string { return `- ${item.label} (${formatEvidence(item.evidence[0])})`; }
function formatEvidence(location: SourceLocation | undefined): string { return location ? `${location.file}${location.line ? `:${location.line}` : ""}` : "source unavailable"; }
function uniqueEvidence(locations: SourceLocation[]): SourceLocation[] { return [...new Map(locations.map((location) => [`${location.file}:${location.line ?? ""}`, location])).values()].sort((left, right) => `${left.file}:${left.line ?? 0}`.localeCompare(`${right.file}:${right.line ?? 0}`)); }
function uniqueFacts(facts: BriefFact[]): BriefFact[] { return [...new Map(facts.map((fact) => [fact.statement, fact])).values()]; }
function mergeEntities(items: BriefEntity[]): BriefEntity[] { return [...new Map(items.map((item) => [item.id, item])).values()].sort((left, right) => left.id.localeCompare(right.id)); }
