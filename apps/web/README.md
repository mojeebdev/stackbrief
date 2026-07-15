# StackBrief web

The independent Next.js home for StackBrief. It is intentionally separate from the npm CLI package.

## Development

```bash
cd apps/web
npm install
npm run dev
```

## Deployment

Import this repository into Vercel and set **Root Directory** to `apps/web`.

For production, point `stackbrief.peerfix.dev` at the resulting Vercel project. The site has static metadata, an Open Graph image, `robots.txt`, and a sitemap ready for deployment.
