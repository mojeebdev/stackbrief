import type { Metadata } from "next";
import { BrandMark } from "../../components/brand-mark";
import { CopyButton } from "../../components/copy-button";

const GITHUB = "https://github.com/mojeebdev/stackbrief";
const NPM = "https://www.npmjs.com/package/@blindspotlab/stackbrief";

export const metadata: Metadata = {
  title: "Evaluate StackBrief",
  description:
    "A reproducible, local-first path to evaluate StackBrief: test the CLI, generate stackbrief.json, and inspect a source-cited pre-change brief.",
  alternates: { canonical: "/evaluate" },
};

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

function CommandBlock({ command }: { command: string }) {
  return (
    <div className="evaluate-command">
      <code><span>$</span>{command}</code>
      <CopyButton command={command} />
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="evaluate-shell">
        <header className="evaluate-header wrap">
          <a className="brand" href="/" aria-label="StackBrief home"><BrandMark /><span>StackBrief</span></a>
          <nav aria-label="Evaluation navigation">
            <a href="/">Product home</a>
            <a href="#workflow">Evaluation path</a>
            <a href="#limits">Limits</a>
          </nav>
          <a className="header-link" href={GITHUB} target="_blank" rel="noreferrer">Repository <ExternalArrow /></a>
        </header>

        <main id="main">
          <section className="evaluate-hero wrap" aria-labelledby="evaluate-title">
            <div>
              <p className="eyebrow"><span className="status-dot" />A reproducible evaluation</p>
              <h1 id="evaluate-title">Follow the evidence <em>before</em> you judge the claim.</h1>
              <p>StackBrief is meant to be inspected, not merely described. This page gives you a short local path from repository to canonical model to source-cited pre-change brief.</p>
              <div className="evaluate-hero-actions">
                <a className="button button-primary" href="#workflow">Run the evaluation <span aria-hidden="true">↓</span></a>
                <a className="text-link" href={GITHUB} target="_blank" rel="noreferrer">Read the source <ExternalArrow /></a>
              </div>
            </div>
            <aside className="evaluation-note" aria-label="Evaluation conditions">
              <p>Evaluation conditions</p>
              <ul>
                <li>Node.js 16.7+</li>
                <li>Git</li>
                <li>No account or API key</li>
                <li>No repository upload</li>
              </ul>
            </aside>
          </section>

          <section className="evaluate-principles" aria-label="What to evaluate">
            <div className="wrap evaluate-principles-grid">
              <p>01 <span>Canonical model</span><small>`stackbrief.json` is a versioned contract, not generated prose.</small></p>
              <p>02 <span>Source evidence</span><small>Findings lead back to files and lines when extraction can prove them.</small></p>
              <p>03 <span>Useful limits</span><small>Unknowns remain visible when static analysis cannot establish a fact.</small></p>
              <p>04 <span>Local first</span><small>The core workflow requires no hosted model, account, telemetry, or upload.</small></p>
            </div>
          </section>

          <section className="evaluate-workflow wrap" id="workflow" aria-labelledby="workflow-title">
            <div className="evaluate-heading">
              <p className="eyebrow dark-eyebrow">The short path</p>
              <h2 id="workflow-title">From clone to a brief you can inspect.</h2>
              <p>Use StackBrief on itself first. The commands below build the typed packages, exercise the automated suite, generate the canonical repository model, and produce a brief around a real implementation file.</p>
            </div>
            <ol className="evaluate-steps">
              <li>
                <span>01</span>
                <div><h3>Clone and verify.</h3><p>Confirm the source, type checks, CLI behaviour, and package contents before trusting the output.</p></div>
                <div className="evaluate-commands">
                  <CommandBlock command="git clone https://github.com/mojeebdev/stackbrief.git" />
                  <CommandBlock command="cd stackbrief && npm ci && npm test" />
                  <CommandBlock command="npm run test:package" />
                </div>
              </li>
              <li>
                <span>02</span>
                <div><h3>Generate the contract.</h3><p>Scan the repository. The result is the versioned `stackbrief.json` model that every local intelligence feature uses.</p></div>
                <div className="evaluate-commands"><CommandBlock command="node bin/cli.js scan" /></div>
              </li>
              <li>
                <span>03</span>
                <div><h3>Read a pre-change brief.</h3><p>Start from a concrete implementation file, not an abstract question about an entire codebase.</p></div>
                <div className="evaluate-commands"><CommandBlock command="node bin/cli.js brief --file packages/brief/src/change-brief.ts" /></div>
              </li>
            </ol>
          </section>

          <section className="evaluate-output">
            <div className="wrap evaluate-output-grid">
              <div>
                <p className="eyebrow">What a useful result looks like</p>
                <h2>A brief should narrow the next decision.</h2>
                <p>For a selected file, expect the brief to identify what static analysis can establish: relevant routes or service boundaries, reached local files, import dependents, database or external API signals, validation targets, and evidence.</p>
              </div>
              <div className="evaluate-sample" aria-label="Illustrative brief output">
                <p className="sample-title">STACKBRIEF: CHANGE-BRIEF.TS</p>
                <p><b>Impact</b><span>Direct dependent: change-brief.test.ts</span></p>
                <p><b>Trace</b><span>packages/intelligence/src/index.ts</span></p>
                <p><b>Validate</b><span>change-brief.test.ts</span></p>
                <p><b>Unknown</b><span>Verify runtime configuration separately.</span></p>
              </div>
            </div>
          </section>

          <section className="evaluate-limits wrap" id="limits" aria-labelledby="limits-title">
            <div className="evaluate-limits-index">↳</div>
            <div>
              <p className="eyebrow dark-eyebrow">A necessary boundary</p>
              <h2 id="limits-title">Static evidence is not runtime certainty.</h2>
            </div>
            <div>
              <p>StackBrief does not execute application code, inspect production traffic, evaluate feature flags, infer authorization rules, or decide whether a change is safe. It marks unresolved evidence as an unknown.</p>
              <p>Framework detection is intentionally broader than deep framework-specific extraction today. The Next.js App Router adapter is isolated so equivalent adapters can grow without changing the canonical model.</p>
            </div>
          </section>

          <section className="evaluate-try">
            <div className="wrap evaluate-try-grid">
              <div><p className="eyebrow">Use it where the work happens</p><h2>Try it in a repository you already know.</h2></div>
              <div><CommandBlock command="npx @blindspotlab/stackbrief scan" /><CommandBlock command="npx @blindspotlab/stackbrief brief --file path/to/a/real/source-file.ts" /><a className="text-link" href={NPM} target="_blank" rel="noreferrer">View the npm package <ExternalArrow /></a></div>
            </div>
          </section>
        </main>

        <footer className="evaluate-footer">
          <div className="wrap"><a className="brand" href="/"><BrandMark /><span>StackBrief</span></a><p>The architectural brief before a code change.</p><a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a><a href={NPM} target="_blank" rel="noreferrer">npm</a><a href="mailto:hello@mojeeb.xyz">hello@mojeeb.xyz</a></div>
        </footer>
      </div>
    </>
  );
}
