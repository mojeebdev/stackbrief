# StackBrief Remotion Demo

This project renders the short product walkthrough embedded on the StackBrief website.

```bash
cd apps/demo
npm install
npm run dev
npm run render
```

The render writes to `../web/public/demo/stackbrief-demo.mp4` for deployment with the Next.js site. The walkthrough is intentionally silent; use the separate narrated YouTube recording for the Devpost submission.

On a machine without an automatically detected browser, set `REMOTION_BROWSER_EXECUTABLE` to a local Chrome or Chromium executable before rendering.
