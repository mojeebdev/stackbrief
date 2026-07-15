import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";

const color = {
  night: "#13212a",
  ink: "#213a43",
  paper: "#e7e5da",
  paperBright: "#f4f1e9",
  teal: "#93b8ae",
  tealDeep: "#5b817b",
  moss: "#415a4e",
  signal: "#e76f3c",
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

function enter(frame: number, start = 0, duration = 18) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

function sceneOpacity(frame: number, duration: number) {
  return interpolate(frame, [0, 12, duration - 14, duration - 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: color.teal, fontSize: 15, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>{children}</div>;
}

function Wordmark() {
  return <div style={{ alignItems: "center", color: color.paper, display: "flex", fontFamily: "Arial, sans-serif", fontSize: 24, fontWeight: 700, gap: 12, letterSpacing: "-0.06em" }}><span style={{ alignItems: "center", border: `2px solid ${color.signal}`, color: color.signal, display: "inline-flex", fontFamily: "Georgia, serif", fontSize: 16, height: 31, justifyContent: "center", transform: "rotate(-7deg)", width: 31 }}>S</span>StackBrief</div>;
}

function Scene({ children, duration }: { children: React.ReactNode; duration: number }) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: sceneOpacity(frame, duration) }}>{children}</AbsoluteFill>;
}

function PaperCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: color.paperBright, border: `1px solid ${color.night}`, boxShadow: "12px 13px 0 rgba(147,184,174,.6)", color: color.night, ...style }}>{children}</div>;
}

function Opening() {
  const frame = useCurrentFrame();
  const title = enter(frame, 9, 22);
  const copy = enter(frame, 29, 20);
  const line = enter(frame, 50, 24);

  return <Scene duration={150}><AbsoluteFill style={{ background: color.night, color: color.paper, padding: "58px 76px" }}>
    <Wordmark />
    <div style={{ alignItems: "flex-start", display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", maxWidth: 940 }}>
      <div style={{ opacity: title, translate: `0 ${interpolate(title, [0, 1], [28, 0])}px` }}><Label>Offline repository intelligence</Label></div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 83, fontWeight: 500, letterSpacing: "-0.075em", lineHeight: 0.95, margin: "24px 0", opacity: title, translate: `0 ${interpolate(title, [0, 1], [34, 0])}px` }}>Know the shape of a change <span style={{ color: color.signal, fontStyle: "italic" }}>before</span> you make it.</h1>
      <p style={{ color: "rgba(244,241,233,.72)", fontFamily: "Arial, sans-serif", fontSize: 27, lineHeight: 1.45, margin: 0, maxWidth: 700, opacity: copy, translate: `0 ${interpolate(copy, [0, 1], [20, 0])}px` }}>A source-cited architectural brief for the moment before an edit—or an agent prompt.</p>
      <div style={{ background: color.signal, height: 4, marginTop: 44, opacity: line, width: interpolate(line, [0, 1], [0, 326]) }} />
    </div>
    <p style={{ bottom: 55, color: "rgba(244,241,233,.5)", fontFamily: "Arial, sans-serif", fontSize: 15, letterSpacing: "0.11em", margin: 0, position: "absolute", textTransform: "uppercase" }}>Build Week 2026 · local first · open source</p>
  </AbsoluteFill></Scene>;
}

function Target() {
  const frame = useCurrentFrame();
  const heading = enter(frame, 7, 18);
  const card = enter(frame, 24, 22);
  const highlight = enter(frame, 67, 24);

  return <Scene duration={165}><AbsoluteFill style={{ alignItems: "stretch", background: color.paper, color: color.night, display: "flex", gap: 68, padding: "76px" }}>
    <div style={{ display: "flex", flex: 0.78, flexDirection: "column", justifyContent: "center" }}>
      <div style={{ opacity: heading, translate: `0 ${interpolate(heading, [0, 1], [26, 0])}px` }}><Label>01 / Start with the real touchpoint</Label></div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 68, fontWeight: 500, letterSpacing: "-0.07em", lineHeight: 0.98, margin: "23px 0" }}>Choose the file where the work begins.</h2>
      <p style={{ color: "rgba(19,33,42,.7)", fontFamily: "Arial, sans-serif", fontSize: 24, lineHeight: 1.45, margin: 0, maxWidth: 500, opacity: enter(frame, 38, 18) }}>StackBrief starts from a concrete change—not a vague request to explain the whole repository.</p>
    </div>
    <PaperCard style={{ alignSelf: "center", flex: 1, opacity: card, padding: "28px 32px", translate: `0 ${interpolate(card, [0, 1], [38, 0])}px` }}>
      <div style={{ borderBottom: "1px solid rgba(19,33,42,.18)", color: color.tealDeep, fontFamily: "Arial, sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", paddingBottom: 16, textTransform: "uppercase" }}>src/services/checkout.ts</div>
      <pre style={{ color: color.ink, fontFamily: "monospace", fontSize: 20, lineHeight: 1.8, margin: "24px 0 0", whiteSpace: "pre-wrap" }}><span style={{ color: color.tealDeep }}>export async function </span><span style={{ color: color.signal }}>startCheckout</span>{"(input) {\n"}<span style={{ background: `rgba(231,111,60,${0.1 + highlight * 0.21})`, display: "inline-block", padding: "0 8px" }}>  return billingClient.create(input);</span>{"\n}"}</pre>
      <div style={{ color: color.signal, fontFamily: "Arial, sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", marginTop: 29, opacity: highlight, textTransform: "uppercase" }}>This is the change surface</div>
    </PaperCard>
  </AbsoluteFill></Scene>;
}

function BriefCommand() {
  const frame = useCurrentFrame();
  const terminal = enter(frame, 8, 20);
  const brief = enter(frame, 47, 24);

  return <Scene duration={180}><AbsoluteFill style={{ background: color.ink, color: color.paper, padding: "70px 76px" }}>
    <div style={{ alignItems: "end", display: "flex", justifyContent: "space-between" }}><Wordmark /><Label>02 / Generate the brief</Label></div>
    <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
      <div style={{ background: color.night, border: "1px solid rgba(231,229,218,.25)", boxShadow: "14px 15px 0 rgba(65,90,78,.8)", opacity: terminal, padding: "28px 34px", translate: `0 ${interpolate(terminal, [0, 1], [32, 0])}px` }}>
        <p style={{ color: color.paper, fontFamily: "monospace", fontSize: 25, margin: 0 }}><span style={{ color: color.signal }}>$</span> stackbrief brief --file src/services/checkout.ts</p>
        <div style={{ background: color.teal, height: 1, margin: "25px 0" }} />
        <div style={{ display: "grid", gap: 12, opacity: brief }}>
          <div style={{ color: color.paper, fontFamily: "Georgia, serif", fontSize: 33 }}>StackBrief: <span style={{ color: color.teal, fontStyle: "italic" }}>checkout.ts</span></div>
          <div style={{ color: "rgba(231,229,218,.53)", fontFamily: "Arial, sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.13em", marginTop: 12 }}>RELEVANT ARCHITECTURE</div>
          <div style={{ color: color.paper, display: "grid", fontFamily: "monospace", fontSize: 21, gap: 7 }}><span><b style={{ color: color.teal }}>Route&nbsp;&nbsp;</b>POST /api/checkout</span><span><b style={{ color: color.teal }}>Service</b> checkout service</span><span><b style={{ color: color.teal }}>Data&nbsp;&nbsp;&nbsp;</b>PostgreSQL</span></div>
        </div>
      </div>
    </div>
  </AbsoluteFill></Scene>;
}

function Architecture() {
  const frame = useCurrentFrame();
  const heading = enter(frame, 8, 19);
  const map = enter(frame, 33, 22);
  const evidence = enter(frame, 75, 20);
  const items = ["Route", "Checkout service", "PostgreSQL", "Billing gateway"];

  return <Scene duration={195}><AbsoluteFill style={{ background: color.paperBright, color: color.night, padding: "72px 76px" }}>
    <div style={{ maxWidth: 670, opacity: heading, translate: `0 ${interpolate(heading, [0, 1], [28, 0])}px` }}><Label>03 / Read the architecture around it</Label><h2 style={{ fontFamily: "Georgia, serif", fontSize: 64, fontWeight: 500, letterSpacing: "-0.07em", lineHeight: 0.98, margin: "23px 0 0" }}>The brief connects the change to the system it touches.</h2></div>
    <div style={{ alignItems: "center", display: "flex", flex: 1, gap: 45, justifyContent: "center", marginTop: 26 }}>
      <div style={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", opacity: map, position: "relative", scale: interpolate(map, [0, 1], [0.94, 1]) }}>
        <div style={{ background: color.night, border: `1px solid ${color.teal}`, color: color.paper, fontFamily: "Arial, sans-serif", fontSize: 20, fontWeight: 700, padding: "21px 26px", zIndex: 1 }}>checkout.ts</div>
        <div style={{ background: color.teal, height: 2, position: "absolute", width: 420 }} />
        <div style={{ background: color.signal, borderRadius: "50%", height: 18, left: "50%", position: "absolute", width: 18 }} />
        <div style={{ border: `1px solid ${color.tealDeep}`, display: "grid", gap: 12, padding: 20, position: "absolute", right: 0, top: -55, width: 202 }}><span style={{ fontFamily: "Arial, sans-serif", fontSize: 14, fontWeight: 700 }}>POST /api/checkout</span><span style={{ color: color.tealDeep, fontFamily: "Arial, sans-serif", fontSize: 14 }}>Public route</span></div>
        <div style={{ border: `1px solid ${color.tealDeep}`, bottom: -55, display: "grid", gap: 12, left: 0, padding: 20, position: "absolute", width: 202 }}><span style={{ fontFamily: "Arial, sans-serif", fontSize: 14, fontWeight: 700 }}>PostgreSQL</span><span style={{ color: color.tealDeep, fontFamily: "Arial, sans-serif", fontSize: 14 }}>Data boundary</span></div>
      </div>
      <PaperCard style={{ flex: 0.8, opacity: evidence, padding: "25px 28px", translate: `0 ${interpolate(evidence, [0, 1], [26, 0])}px` }}>
        <Label>Evidence, not guesses</Label>
        <div style={{ display: "grid", gap: 15, marginTop: 23 }}>{items.map((item, index) => <div key={item} style={{ alignItems: "center", borderTop: index === 0 ? 0 : "1px solid rgba(19,33,42,.14)", display: "flex", fontFamily: "Arial, sans-serif", fontSize: 20, gap: 12, paddingTop: index === 0 ? 0 : 15 }}><span style={{ background: index === 3 ? color.signal : color.tealDeep, borderRadius: "50%", height: 8, width: 8 }} />{item}</div>)}</div>
      </PaperCard>
    </div>
  </AbsoluteFill></Scene>;
}

function Unknowns() {
  const frame = useCurrentFrame();
  const card = enter(frame, 12, 22);
  const thought = enter(frame, 48, 22);

  return <Scene duration={160}><AbsoluteFill style={{ background: color.moss, color: color.paper, padding: "72px 76px" }}>
    <div style={{ alignItems: "end", display: "flex", justifyContent: "space-between" }}><Wordmark /><Label>04 / Keep uncertainty visible</Label></div>
    <div style={{ alignItems: "center", display: "flex", flex: 1, gap: 82, justifyContent: "center" }}>
      <div style={{ border: "1px solid rgba(231,229,218,.4)", maxWidth: 590, opacity: card, padding: "28px 32px", translate: `0 ${interpolate(card, [0, 1], [32, 0])}px`, width: "100%" }}>
        <div style={{ color: color.signal, fontFamily: "Arial, sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>Static unknown</div>
        <p style={{ color: color.paper, fontFamily: "Georgia, serif", fontSize: 38, letterSpacing: "-0.055em", lineHeight: 1.15, margin: "20px 0 0" }}>Verify runtime configuration, feature flags, and production traffic separately.</p>
      </div>
      <div style={{ maxWidth: 420, opacity: thought, translate: `0 ${interpolate(thought, [0, 1], [24, 0])}px` }}><h2 style={{ fontFamily: "Georgia, serif", fontSize: 59, fontWeight: 500, letterSpacing: "-0.07em", lineHeight: 0.98, margin: 0 }}>The goal is not automatic certainty.</h2><p style={{ color: "rgba(231,229,218,.7)", fontFamily: "Arial, sans-serif", fontSize: 23, lineHeight: 1.45, margin: "22px 0 0" }}>It is a clearer decision before the code changes.</p></div>
    </div>
  </AbsoluteFill></Scene>;
}

function Closing() {
  const frame = useCurrentFrame();
  const title = enter(frame, 7, 20);
  const cta = enter(frame, 29, 18);

  return <Scene duration={110}><AbsoluteFill style={{ alignItems: "center", background: color.night, color: color.paper, display: "flex", justifyContent: "center", padding: "70px 76px", textAlign: "center" }}>
    <div style={{ alignItems: "center", display: "flex", flexDirection: "column", maxWidth: 930 }}>
      <div style={{ opacity: title, scale: interpolate(title, [0, 1], [0.96, 1]) }}><Wordmark /></div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 70, fontWeight: 500, letterSpacing: "-0.075em", lineHeight: 0.96, margin: "29px 0 24px", opacity: title }}>The architectural brief before a <span style={{ color: color.signal, fontStyle: "italic" }}>code change.</span></h2>
      <div style={{ border: `1px solid ${color.signal}`, color: color.paper, fontFamily: "monospace", fontSize: 21, opacity: cta, padding: "16px 21px" }}>npx @blindspotlab/stackbrief scan</div>
    </div>
  </AbsoluteFill></Scene>;
}

export const StackBriefDemo = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={150}><Opening /></Sequence>
    <Sequence from={150} durationInFrames={165}><Target /></Sequence>
    <Sequence from={315} durationInFrames={180}><BriefCommand /></Sequence>
    <Sequence from={495} durationInFrames={195}><Architecture /></Sequence>
    <Sequence from={690} durationInFrames={160}><Unknowns /></Sequence>
    <Sequence from={850} durationInFrames={110}><Closing /></Sequence>
  </AbsoluteFill>
);
