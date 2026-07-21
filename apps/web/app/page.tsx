import { BrandMark } from "../components/brand-mark";
import { CopyButton } from "../components/copy-button";
import { FieldMap } from "../components/field-map";
import { OriginArtwork } from "../components/origin-artwork";
import {
  getRepositoryMetrics,
  type RepositoryMetrics,
} from "../lib/repository-metrics";

const GITHUB = "https://github.com/mojeebdev/stackbrief";
const NPM = "https://www.npmjs.com/package/@blindspotlab/stackbrief";
const ORIGIN_POST = "https://x.com/MojeebMotion/status/2078447946782163291?s=20";
const FOUNDER_X = "https://x.com/MojeebMotion";

// Next requires route-segment values to be statically analyzable literals.
export const revalidate = 3600;

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function HeroMetrics({ metrics }: { metrics: RepositoryMetrics }) {
  const hasMetrics =
    metrics.githubStars !== undefined ||
    metrics.npmDownloadsSinceLaunch !== undefined;

  if (!hasMetrics) return null;

  return (
    <div className="hero-metrics" aria-label="Public StackBrief repository metrics">
      <div className="hero-metric-list">
        {metrics.githubStars !== undefined ? (
          <a
            className="hero-metric"
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label={`${formatCount(metrics.githubStars)} GitHub stars. View the StackBrief repository.`}
          >
            <strong>{formatCount(metrics.githubStars)}</strong>
            <span>GitHub stars</span>
          </a>
        ) : null}
        {metrics.npmDownloadsSinceLaunch !== undefined ? (
          <a
            className="hero-metric"
            href={NPM}
            target="_blank"
            rel="noreferrer"
            aria-label={`${formatCount(metrics.npmDownloadsSinceLaunch)} npm downloads since StackBrief launched. View the package.`}
          >
            <strong>{formatCount(metrics.npmDownloadsSinceLaunch)}</strong>
            <span>npm downloads since launch</span>
          </a>
        ) : null}
      </div>
      <p>Public repository metrics · refreshed hourly</p>
    </div>
  );
}

export default async function HomePage() {
  const metrics = await getRepositoryMetrics();

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-shell">
        <header className="site-header wrap">
          <a className="brand" href="#top" aria-label="StackBrief home"><BrandMark /><span>StackBrief</span></a>
          <nav className="nav-links" aria-label="Primary navigation">
            <a href="#why">Why it exists</a>
            <a href="#workflow">How it works</a>
            <a href="#demo">See it in motion</a>
            <a href="#origin">Origin</a>
          </nav>
          <a className="header-link" href={GITHUB} target="_blank" rel="noreferrer"><span>Star on GitHub</span><ExternalArrow /></a>
        </header>

        <main id="main">
          <section className="hero wrap" id="top" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow"><span className="status-dot" />Open source · local first · Build Week 2026</p>
              <h1 id="hero-title">Know the shape of a change <em>before</em> you make it.</h1>
              <p className="hero-intro">StackBrief gives you a source-cited architectural brief before you edit code—or hand the work to an agent.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#install">Start with the CLI <span aria-hidden="true">↓</span></a>
                <a className="text-link" href={GITHUB} target="_blank" rel="noreferrer">Read the repository <ExternalArrow /></a>
              </div>
              <HeroMetrics metrics={metrics} />
              <div className="hero-proof" aria-label="StackBrief principles"><span>Offline analysis</span><i /><span>Source-cited</span><i /><span>Agent-neutral</span></div>
            </div>
            <FieldMap />
          </section>

          <section className="statement-band" id="why" aria-label="StackBrief proposition">
            <div className="wrap statement-grid">
              <p className="section-kicker">The point of a brief</p>
              <p className="statement">Documentation tells you what a system <em>was.</em> StackBrief helps you see what a change <em>touches.</em></p>
              <p className="statement-note">Not to slow a developer down. To make the consequences visible while there is still time to choose well.</p>
            </div>
          </section>

          <section className="origin-section wrap" id="origin" aria-labelledby="origin-title">
            <OriginArtwork />
            <div className="origin-copy">
              <p className="eyebrow dark-eyebrow">A project with an origin</p>
              <h2 id="origin-title">It started as a developer skill called <em>stack.md.</em></h2>
              <p>Its first job was simple: help someone understand the technology stack in an unfamiliar repository. Repeated use exposed a larger problem.</p>
              <p>READMEs drift. Architecture lives in people’s heads. The knowledge needed before a change is scattered across files, dependencies, routes, and runtime assumptions.</p>
              <p className="origin-quote">The rest, as they say, is history.</p>
              <a className="text-link dark-link" href={ORIGIN_POST} target="_blank" rel="noreferrer">Read the launch post <ExternalArrow /></a>
            </div>
          </section>

          <section className="workflow-section" id="workflow" aria-labelledby="workflow-title">
            <div className="wrap workflow-heading">
              <div>
                <p className="eyebrow">A daily practice, not a ceremony</p>
                <h2 id="workflow-title">Find the file. Read the shape. Make the change.</h2>
              </div>
              <p>StackBrief belongs between “I think this is the place” and your first edit. The result is small enough to use every day—and grounded enough to inspect.</p>
            </div>
            <div className="wrap process-rail">
              <article className="process-step step-target"><span className="step-index">01 / target</span><h3>Start where the work starts.</h3><p>Point to the most likely file. The brief begins with a real touchpoint, not a vague question about the whole repository.</p><div className="file-chip"><span className="file-glyph">↳</span>src/services/checkout.ts</div></article>
              <article className="process-step step-brief"><span className="step-index">02 / brief</span><h3>See the architecture around it.</h3><p>Routes, services, databases, external APIs, affected files, and static unknowns—each carried with source evidence.</p><div className="micro-brief"><span>POST /api/checkout</span><span>Billing gateway via client.ts</span><span>PostgreSQL</span></div></article>
              <article className="process-step step-change"><span className="step-index">03 / change</span><h3>Change with intent.</h3><p>Use the brief to choose the implementation and a review checklist. Keep runtime and product questions where they belong: with the developer.</p><div className="signal-stamp">human judgement<br />stays in the loop</div></article>
            </div>
          </section>

          <section className="demo-section" id="demo" aria-labelledby="demo-title">
            <div className="wrap demo-layout">
              <div className="demo-copy">
                <p className="eyebrow dark-eyebrow">A short visual walkthrough</p>
                <h2 id="demo-title">See the brief before the edit.</h2>
                <p>Follow a generic checkout change from its starting file to the architectural context around it—routes, data boundaries, dependencies, and the questions static analysis should leave visible.</p>
                <p className="demo-note">32 seconds · rendered locally with Remotion · no repository data leaves the machine</p>
              </div>
              <figure className="demo-player">
                <figcaption><span>StackBrief product walkthrough</span><span>00:32</span></figcaption>
                <video controls playsInline preload="metadata" aria-describedby="demo-transcript-note">
                  <source src="/demo/stackbrief-demo.mp4" type="video/mp4" />
                  Your browser does not support embedded video. <a href="/demo/stackbrief-demo.mp4">Download the StackBrief product walkthrough.</a>
                </video>
                <p id="demo-transcript-note" className="sr-only">The video shows a local StackBrief brief for a generic checkout file, including source-cited architecture and explicit static unknowns.</p>
              </figure>
            </div>
          </section>

          <section className="terminal-section wrap" id="install" aria-labelledby="install-title">
            <div className="terminal-copy">
              <p className="eyebrow">The home is still your terminal</p>
              <h2 id="install-title">A clear thought, right next to the code.</h2>
              <p>StackBrief makes no network request to analyze your repository. It keeps the evidence local and leaves runtime decisions with the developer.</p>
              <div className="terminal-meta"><span>Works offline</span><span>Runs locally</span><span>Uses source evidence</span></div>
            </div>
            <div className="terminal-window" aria-label="Example StackBrief terminal session">
              <div className="terminal-top"><span /><span /><span /><p>stackbrief — sample-repository</p></div>
              <div className="terminal-body">
                <p><b>$</b> stackbrief brief --file src/services/checkout.ts</p>
                <p className="terminal-title">StackBrief: <strong>src/services/checkout.ts</strong></p>
                <p className="terminal-label">RELEVANT ARCHITECTURE</p>
                <p><span className="terminal-accent">Route</span>POST /api/checkout</p>
                <p><span className="terminal-accent">API</span>Billing gateway via src/lib/billing/client.ts</p>
                <p><span className="terminal-accent">Data</span>PostgreSQL</p>
                <p className="terminal-label">UNKNOWN</p>
                <p><span className="terminal-warning">○</span> Verify runtime configuration and production traffic separately.</p>
                <p className="terminal-cursor"><b>$</b><i /></p>
              </div>
            </div>
            <div className="install-cards">
              <div className="install-card"><span>01</span><p>Use the CLI</p><code>npx @blindspotlab/stackbrief brief --file &lt;path&gt;</code><CopyButton command="npx @blindspotlab/stackbrief brief --file <path>" /></div>
              <div className="install-card"><span>02</span><p>Bring your own agent</p><code>stackbrief agent install --path .agents/skills</code><CopyButton command="stackbrief agent install --path .agents/skills" /></div>
            </div>
          </section>

          <section className="for-section wrap" aria-labelledby="for-title">
            <div className="for-heading"><p className="eyebrow dark-eyebrow">A shared reference point</p><h2 id="for-title">For anyone who needs to know <em>before</em> they go.</h2></div>
            <div className="audience-grid">
              <article className="audience-card"><span className="audience-symbol">↗</span><h3>The new contributor</h3><p>Find a sensible entry point and understand the constraints without spending days reconstructing the codebase from memory.</p></article>
              <article className="audience-card"><span className="audience-symbol">⊕</span><h3>The long-time maintainer</h3><p>Bring the hidden coupling around a change into view before the simple-looking edit becomes a production surprise.</p></article>
              <article className="audience-card"><span className="audience-symbol">⌁</span><h3>The coding agent</h3><p>Give an agent evidence before a prompt becomes a patch. StackBrief is agent-neutral by design, not locked to one model or tool.</p></article>
            </div>
          </section>

          <section className="founder-section" aria-labelledby="founder-title">
            <div className="wrap founder-layout">
              <div className="founder-seal" aria-hidden="true"><span>SB</span><i /><small>BUILT WITH<br />CURIOSITY</small></div>
              <div className="founder-copy">
                <p className="eyebrow">Built by a practitioner</p>
                <h2 id="founder-title">Built by Mojeeb Titilayo, for the moment before the code changes.</h2>
                <p>Mojeeb is an AI Product Engineer and founder of BlindspotLab—a historian turned builder who has shipped 30+ products across AI, developer tools, SaaS, and Web3.</p>
                <p>StackBrief emerged from repository work, architectural review, and a simple requirement: the right context should be available before the edit.</p>
                <div className="founder-links"><a href="https://mojeeb.xyz" target="_blank" rel="noreferrer">mojeeb.xyz <ExternalArrow /></a><a href="https://blindspotlab.xyz" target="_blank" rel="noreferrer">blindspotlab.xyz <ExternalArrow /></a><a href={FOUNDER_X} target="_blank" rel="noreferrer">@MojeebMotion <ExternalArrow /></a></div>
              </div>
            </div>
          </section>

          <section className="genesis-section wrap" aria-labelledby="genesis-title">
            <div className="genesis-number">2026</div>
            <div><p className="eyebrow dark-eyebrow">The genesis chapter</p><h2 id="genesis-title">The first public release took shape during OpenAI Build Week 2026.</h2></div>
            <p>GPT-5.6 challenged the product and architecture; Codex accelerated implementation, tests, release preparation, and documentation. Engineering judgement remained with the maintainer.</p>
            <a className="text-link dark-link" href={ORIGIN_POST} target="_blank" rel="noreferrer">From the origin post <ExternalArrow /></a>
          </section>

          <section className="community-section" aria-labelledby="community-title">
            <div className="wrap community-layout">
              <div><p className="eyebrow">Make the map stronger</p><h2 id="community-title">If it earns a place in your workflow, leave a mark.</h2></div>
              <div className="community-actions"><a className="button button-light" href={GITHUB} target="_blank" rel="noreferrer">Star the repository <ExternalArrow /></a><a className="button button-outline" href={NPM} target="_blank" rel="noreferrer">Review on npm <ExternalArrow /></a><p>Want to contribute a detector, framework adapter, or a better idea? Write to <a href="mailto:hello@mojeeb.xyz">hello@mojeeb.xyz</a>.</p></div>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="wrap footer-top">
            <div><a className="brand footer-brand" href="#top"><BrandMark /><span>StackBrief</span></a><p>The architectural brief before a code change.</p></div>
            <div className="footer-links">
              <div><p>Find it</p><a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a><a href={NPM} target="_blank" rel="noreferrer">npm</a><a href="https://stackbrief.peerfix.dev" target="_blank" rel="noreferrer">Project home</a></div>
              <div><p>OpenAI ecosystem</p><a href="https://chatgpt.com" target="_blank" rel="noreferrer">ChatGPT</a><a href="https://openai.com/codex/" target="_blank" rel="noreferrer">Codex</a><a href="https://openai.com" target="_blank" rel="noreferrer">OpenAI</a><a href="https://devpost.com" target="_blank" rel="noreferrer">Devpost</a></div>
              <div><p>Founder</p><a href="https://blindspotlab.xyz" target="_blank" rel="noreferrer">BlindspotLab</a><a href="https://mojeeb.xyz" target="_blank" rel="noreferrer">mojeeb.xyz</a><a href={FOUNDER_X} target="_blank" rel="noreferrer">x.com/MojeebMotion</a></div>
            </div>
          </div>
          <div className="wrap footer-bottom"><span>© 2026 StackBrief</span><span>Open source · published on GitHub &amp; npm · deployable on Vercel</span></div>
        </footer>
      </div>
    </>
  );
}
