const GITHUB_REPOSITORY = "mojeebdev/stackbrief";
const NPM_PACKAGE = "@blindspotlab/stackbrief";
const PACKAGE_LAUNCH_DATE = "2026-07-12";

export const REPOSITORY_METRICS_REVALIDATE_SECONDS = 60 * 60;

export interface RepositoryMetrics {
  githubStars?: number;
  npmDownloadsSinceLaunch?: number;
}

interface GitHubRepositoryResponse {
  stargazers_count?: unknown;
}

interface NpmDownloadsResponse {
  downloads?: unknown;
}

function asCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined;
}

function currentUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchJson<T>(url: string, headers?: HeadersInit): Promise<T | undefined> {
  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate: REPOSITORY_METRICS_REVALIDATE_SECONDS },
    });

    if (!response.ok) return undefined;

    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

async function fetchGitHubStars(): Promise<number | undefined> {
  const repository = await fetchJson<GitHubRepositoryResponse>(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}`,
    {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  );

  return asCount(repository?.stargazers_count);
}

async function fetchNpmDownloadsSinceLaunch(): Promise<number | undefined> {
  const range = `${PACKAGE_LAUNCH_DATE}:${currentUtcDate()}`;
  const packageName = encodeURIComponent(NPM_PACKAGE);
  const downloads = await fetchJson<NpmDownloadsResponse>(
    `https://api.npmjs.org/downloads/point/${range}/${packageName}`,
  );

  return asCount(downloads?.downloads);
}

/**
 * Public signals only. A missing provider result intentionally does not make the
 * homepage fail: the available metric can still be rendered on its own.
 */
export async function getRepositoryMetrics(): Promise<RepositoryMetrics> {
  const [githubStars, npmDownloadsSinceLaunch] = await Promise.all([
    fetchGitHubStars(),
    fetchNpmDownloadsSinceLaunch(),
  ]);

  return { githubStars, npmDownloadsSinceLaunch };
}
