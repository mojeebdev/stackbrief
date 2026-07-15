"use client";

import { useState } from "react";

export function CopyButton({ command }: { command: string }) {
  const [label, setLabel] = useState("Copy command");

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setLabel("Copied");
    } catch {
      setLabel("Copy unavailable");
    }
    window.setTimeout(() => setLabel("Copy command"), 1800);
  }

  return <button className="copy-button" type="button" onClick={copyCommand}>{label}</button>;
}
