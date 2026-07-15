import { ImageResponse } from "next/og";

export const alt = "StackBrief — Know the shape of a change before you make it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ height: "100%", width: "100%", display: "flex", padding: "64px", background: "#13212a", color: "#e7e5da", fontFamily: "serif", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "66%" }}>
        <div style={{ display: "flex", color: "#93b8ae", fontFamily: "sans-serif", fontSize: 20, letterSpacing: 4, textTransform: "uppercase" }}>Open source · local first</div>
        <div style={{ display: "flex", marginTop: 46, fontSize: 72, lineHeight: 1.03, letterSpacing: -3 }}>Know the shape of a change before you make it.</div>
        <div style={{ display: "flex", marginTop: 36, color: "#93b8ae", fontFamily: "sans-serif", fontSize: 24 }}>The architectural brief before a code change.</div>
      </div>
      <div style={{ position: "absolute", right: 66, top: 82, display: "flex", width: 298, height: 404, border: "2px solid #93b8ae", transform: "rotate(4deg)" }}>
        <div style={{ position: "absolute", left: 34, top: 58, width: 150, height: 42, border: "2px solid #93b8ae" }} /><div style={{ position: "absolute", left: 85, top: 170, width: 160, height: 42, border: "2px solid #93b8ae" }} /><div style={{ position: "absolute", left: 35, top: 285, width: 170, height: 42, border: "2px solid #93b8ae" }} />
        <div style={{ position: "absolute", left: 13, top: 78, width: 88, height: 3, background: "#e76f3c", transform: "rotate(33deg)" }} /><div style={{ position: "absolute", left: 148, top: 195, width: 77, height: 3, background: "#e76f3c", transform: "rotate(44deg)" }} />
        <div style={{ position: "absolute", right: -29, bottom: -20, display: "flex", padding: "17px 21px", background: "#e7e5da", color: "#13212a", fontFamily: "sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>THE BRIEF</div>
      </div>
      <div style={{ position: "absolute", left: 64, bottom: 47, display: "flex", color: "#e76f3c", fontFamily: "sans-serif", fontSize: 28, fontWeight: 700 }}>STACKBRIEF</div>
    </div>,
    size,
  );
}
