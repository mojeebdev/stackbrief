import type { Metadata, Viewport } from "next";
import "./globals.css";

const productStatement = "The architectural brief before a code change.";

export const metadata: Metadata = {
  metadataBase: new URL("https://stackbrief.peerfix.dev"),
  title: {
    default: `StackBrief — ${productStatement}`,
    template: "%s | StackBrief",
  },
  description: "Know the shape of a change before you make it. StackBrief is a local-first CLI for source-cited repository architecture briefs.",
  applicationName: "StackBrief",
  keywords: ["repository understanding", "repository intelligence", "architectural brief", "developer tools", "architecture", "CLI", "open source"],
  authors: [{ name: "Mojeeb Titilayo", url: "https://mojeeb.xyz" }],
  creator: "Mojeeb Titilayo",
  publisher: "BlindspotLab",
  category: "Developer tools",
  openGraph: {
    title: `StackBrief — ${productStatement}`,
    description: "Know the shape of a change before you make it. Local, source-cited architectural context before the first edit.",
    url: "/",
    siteName: "StackBrief",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@MojeebMotion",
    site: "@MojeebMotion",
    title: `StackBrief — ${productStatement}`,
    description: "Know the shape of a change before you make it. Local, source-cited architectural context before the first edit.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#13212a",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StackBrief",
  description: productStatement,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  isAccessibleForFree: true,
  license: "https://github.com/mojeebdev/stackbrief/blob/main/LICENSE",
  codeRepository: "https://github.com/mojeebdev/stackbrief",
  downloadUrl: "https://www.npmjs.com/package/@blindspotlab/stackbrief",
  url: "https://stackbrief.peerfix.dev",
  author: {
    "@type": "Person",
    name: "Mojeeb Titilayo",
    url: "https://mojeeb.xyz",
    sameAs: ["https://x.com/MojeebMotion"],
  },
  publisher: {
    "@type": "Organization",
    name: "BlindspotLab",
    url: "https://blindspotlab.xyz",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
