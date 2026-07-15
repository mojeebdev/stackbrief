import { FileNode, KnowledgeId, SourceLocation } from "../../types/src";

export interface OutboundHttpApi {
  name: string;
  host: string;
  projectId: KnowledgeId;
  adapterFileId: KnowledgeId;
  evidence: SourceLocation[];
}

const KNOWN_HOSTS: Record<string, string> = {
  "api.paystack.co": "Paystack",
  "api.stripe.com": "Stripe",
  "api.openai.com": "OpenAI",
  "api.anthropic.com": "Anthropic",
  "api.resend.com": "Resend",
  "api.twilio.com": "Twilio",
};

/** Detects static outbound fetch clients, including URL constants used in template-literal fetch calls. */
export function findOutboundHttpApis(texts: ReadonlyMap<string, string>, files: FileNode[]): OutboundHttpApi[] {
  const fileByPath = new Map(files.map((file) => [file.path, file]));
  const output: OutboundHttpApi[] = [];
  for (const [path, text] of texts) {
    const file = fileByPath.get(path);
    if (!file || file.kind !== "source") continue;
    const constants = urlConstants(text, path);
    for (const match of text.matchAll(/\bfetch\s*\(\s*[`'"](https?:\/\/[^\s`'"]+)/g)) {
      const api = fromUrl(match[1], file, [{ file: path, line: lineNumber(text, match.index ?? 0) }]);
      if (api) output.push(api);
    }
    for (const match of text.matchAll(/\bfetch\s*\(\s*`\$\{([A-Za-z_$][\w$]*)\}/g)) {
      const constant = constants.get(match[1]);
      if (!constant) continue;
      const api = fromUrl(constant.url, file, [constant.evidence, { file: path, line: lineNumber(text, match.index ?? 0) }]);
      if (api) output.push(api);
    }
  }
  return deduplicate(output);
}

function urlConstants(text: string, file: string): Map<string, { url: string; evidence: SourceLocation }> {
  const constants = new Map<string, { url: string; evidence: SourceLocation }>();
  for (const match of text.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*[`'"](https?:\/\/[^\s`'"]+)/g)) {
    constants.set(match[1], { url: match[2], evidence: { file, line: lineNumber(text, match.index ?? 0) } });
  }
  return constants;
}

function fromUrl(value: string, file: FileNode, evidence: SourceLocation[]): OutboundHttpApi | undefined {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return undefined;
    return { name: KNOWN_HOSTS[host] ?? host, host, projectId: file.projectId, adapterFileId: file.id, evidence };
  } catch {
    return undefined;
  }
}

function deduplicate(items: OutboundHttpApi[]): OutboundHttpApi[] {
  const unique = new Map<string, OutboundHttpApi>();
  for (const item of items) {
    const key = `${item.projectId}:${item.name}:${item.adapterFileId}`;
    const current = unique.get(key);
    if (current) current.evidence.push(...item.evidence);
    else unique.set(key, { ...item, evidence: [...item.evidence] });
  }
  return [...unique.values()].sort((left, right) => `${left.projectId}:${left.name}:${left.adapterFileId}`.localeCompare(`${right.projectId}:${right.name}:${right.adapterFileId}`));
}

function lineNumber(text: string, index: number): number { return text.slice(0, index).split("\n").length; }
