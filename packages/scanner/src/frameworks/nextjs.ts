import { ApiRoute } from "../../../types/src";

const HTTP_METHODS = "GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD";

/** Extracts Next.js App Router route handlers without coupling the canonical model to Next.js. */
export function nextAppRoutes(file: string, text: string): ApiRoute[] {
  const path = routePath(file);
  if (!path) return [];
  const routes = new Map<string, ApiRoute>();
  const patterns = [
    new RegExp(`^\\s*export\\s+(?:async\\s+)?function\\s+(${HTTP_METHODS})\\b`, "gm"),
    new RegExp(`^\\s*export\\s+const\\s+(${HTTP_METHODS})\\s*=`, "gm"),
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const method = match[1].toUpperCase();
      const key = `${method} ${path}`;
      routes.set(key, { path, method, framework: "nextjs-app-router", evidence: [{ file, line: lineNumber(text, match.index ?? 0) }] });
    }
  }
  return [...routes.values()];
}

function routePath(file: string): string | undefined {
  const match = file.match(/^(?:src\/)?app\/(.+)\/route\.(?:[cm]?[jt]sx?)$/i);
  if (!match) return undefined;
  const segments = match[1].split("/").filter((segment) => !/^\(.+\)$/.test(segment));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

function lineNumber(text: string, index: number): number { return text.slice(0, index).split("\n").length; }
