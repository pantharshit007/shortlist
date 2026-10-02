import { createServer } from "node:http";
import { createTectonic } from "./lib/latex/tectonic.js";

// Standalone LaTeX compile service. In production it runs in its own container with no app
// secrets, no internet access and a read-only filesystem, so untrusted LaTeX can't reach anything valuable.

const port = Number(process.env.PORT ?? 4100);
const maxBytes = 1_000_000;
const compile = createTectonic({
  bin: process.env.TECTONIC_BIN ?? "tectonic",
  onlyCached: process.env.TECTONIC_ONLY_CACHED === "true",
  timeoutMs: Number(process.env.COMPILE_TIMEOUT_MS ?? 20_000),
  concurrency: Number(process.env.COMPILE_CONCURRENCY ?? 2),
});

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" }).end('{"status":"ok"}');
    return;
  }
  if (req.method !== "POST" || req.url !== "/compile") {
    res.writeHead(404).end();
    return;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > maxBytes) {
      res.writeHead(413).end();
      return;
    }
    chunks.push(chunk as Buffer);
  }

  // The API hangs up when the editor no longer needs this PDF.
  const abandoned = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abandoned.abort();
  });
  try {
    const result = await compile(Buffer.concat(chunks).toString("utf8"), abandoned.signal);
    if (result.ok) {
      res.writeHead(200, { "content-type": "application/pdf" }).end(result.pdf);
    } else {
      res.writeHead(422, { "content-type": "application/json" }).end(JSON.stringify({ errors: result.errors }));
    }
  } catch (err) {
    if (abandoned.signal.aborted) return;
    console.error(err);
    res.writeHead(500).end();
  }
});

server.listen(port, () => console.log(`Compiler listening on port ${port}`));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
