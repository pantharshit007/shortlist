import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { createTectonic } from "../src/lib/latex/tectonic.js";

const hasTectonic = (() => {
  try {
    execFileSync("tectonic", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

const doc = (text: string) => `\\documentclass{article}\\begin{document}${text}\\end{document}`;

describe.skipIf(!hasTectonic)("cancelling a compile", () => {
  it("drops a queued compile so the next one gets its slot", async () => {
    const compile = createTectonic({ bin: "tectonic", onlyCached: false, timeoutMs: 120_000, concurrency: 1 });
    const stale = new AbortController();
    const first = compile(doc("first"));
    const second = compile(doc("stale"), stale.signal);
    const third = compile(doc("latest"));
    stale.abort();
    await expect(second).rejects.toThrow();
    expect((await first).ok).toBe(true);
    expect((await third).ok).toBe(true);
  }, 180_000);
});
