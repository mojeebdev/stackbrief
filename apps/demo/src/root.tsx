import { Composition } from "remotion";
import { StackBriefDemo } from "./stackbrief-demo";

export const RemotionRoot = () => (
  <Composition
    id="StackBriefDemo"
    component={StackBriefDemo}
    durationInFrames={960}
    fps={30}
    width={1280}
    height={720}
  />
);
