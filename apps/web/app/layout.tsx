import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://stackbrief.peerfix.dev"),
  title: "StackBrief — Know the shape of a change",
  description: "The offline architectural brief before a code change.",
  keywords: ["repository understanding", "developer tools", "architecture", "CLI", "open source"],
  authors: [{ name: "Mojeeb Titilayo", url: "https://mojeeb.xyz" }],
  openGraph: {
    title: "StackBrief — Know the shape of a change",
    description: "The offline architectural brief before a code change.",
    url: "/",
    siteName: "StackBrief",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@tmojeeb",
    title: "StackBrief — Know the shape of a change",
    description: "The offline architectural brief before a code change.",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#13212a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
