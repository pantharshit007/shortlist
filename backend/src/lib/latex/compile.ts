import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { env } from "../../config/env.js";
import { AppError } from "../errors.js";
import { storage } from "../storage.js";
import { type CompileError, createTectonic, makeXetexCompatible } from "./tectonic.js";

export type { CompileError };
export type CompileResult =
  { ok: true; pdf: Buffer; pageCount: number; cached: boolean } | { ok: false; errors: CompileError[] };

// Development only: compiles in-process. Production uses the separate compiler service (COMPILER_URL).
const localCompile = env.COMPILER_URL
  ? null
  : createTectonic({
      bin: env.TECTONIC_BIN,
      onlyCached: env.TECTONIC_ONLY_CACHED,
      timeoutMs: env.COMPILE_TIMEOUT_MS,
      concurrency: env.COMPILE_CONCURRENCY,
    });

async function remoteCompile(tex: string) {
  const response = await fetch(`${env.COMPILER_URL}/compile`, {
    method: "POST",
    headers: { "content-type": "text/plain; charset=utf-8" },
    body: tex,
    signal: AbortSignal.timeout(env.COMPILE_TIMEOUT_MS + 5_000),
  });
  if (response.status === 200) return { ok: true as const, pdf: Buffer.from(await response.arrayBuffer()) };
  if (response.status === 422) {
    const body = (await response.json()) as { errors: CompileError[] };
    return { ok: false as const, errors: body.errors };
  }
  if (response.status === 413) throw new AppError(413, "PAYLOAD_TOO_LARGE", "The LaTeX source is too large");
  throw new AppError(502, "COMPILER_UNAVAILABLE", "The LaTeX compiler is unavailable. Try again.");
}

async function pageCount(pdf: Buffer) {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  return doc.getPageCount();
}

export async function compileTex(source: string): Promise<CompileResult> {
  const tex = makeXetexCompatible(source);
  const cacheKey = `compiled/${createHash("sha256").update(tex).digest("hex")}.pdf`;

  const cachedPdf = await storage.get(cacheKey);
  if (cachedPdf) return { ok: true, pdf: cachedPdf, pageCount: await pageCount(cachedPdf), cached: true };

  const result = localCompile ? await localCompile(tex) : await remoteCompile(tex);
  if (!result.ok) return result;

  await storage.put(cacheKey, result.pdf, "application/pdf");
  return { ok: true, pdf: result.pdf, pageCount: await pageCount(result.pdf), cached: false };
}
