import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: "https://stackbrief.peerfix.dev", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "https://stackbrief.peerfix.dev/evaluate", lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];
}
