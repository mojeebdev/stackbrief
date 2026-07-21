# StackBrief web

The independent Next.js home for StackBrief. It explains the product, documents the local-first workflow, and links developers to the public CLI package. It is intentionally separate from the npm CLI package and never receives repository analysis data.

The website uses two complementary pieces of product language:

- **Product statement:** “The architectural brief before a code change.”
- **Homepage hero:** “Know the shape of a change before you make it.”

The first names the product; the second describes the developer outcome. Do not merge or replace either without a deliberate product decision.

## Public metrics

The hero can show two public, source-linked credibility signals: GitHub stars and npm downloads since StackBrief launched on 2026-07-12. They are fetched server-side and cached for one hour, so the page never exposes a token or depends on client-side requests. If either public API is unavailable or rate-limited, that one metric is omitted; the homepage still renders normally.

The npm label deliberately says **downloads since launch**. npm's download endpoint reports a requested date range, so StackBrief does not present it as an ambiguous all-time total.

## Evaluation page

`/evaluate` is the public, readable companion to the repository's `JUDGES.md`. It gives a skeptical developer a short, reproducible evaluation path: clone, test, scan, and inspect a source-cited brief. Keep its claims consistent with the CLI and its static-analysis limits.

## Development

```bash
cd apps/web
npm install
npm run dev
```

## Deployment

Import this repository into Vercel and set **Root Directory** to `apps/web`.

For production, point `stackbrief.peerfix.dev` at the resulting Vercel project. The site has static metadata, JSON-LD software metadata, an Open Graph image, `robots.txt`, and a sitemap ready for deployment.

## Content and accessibility checks

Before deployment, confirm that:

- The canonical product statement and homepage hero retain their distinct roles.
- The founder profile uses [@MojeebMotion](https://x.com/MojeebMotion), and the public launch-post link points to the current StackBrief announcement.
- External links use safe `rel` attributes and visible copy explains their destination.
- Keyboard focus remains visible, media has a text fallback, and reduced-motion preferences are respected.
- No sample output, screenshots, or public pages reveal source code, environment values, or private repository data.
