import { writeFileSync } from "node:fs";
import { buildOpenApiDocument } from "../openapi.js";

// Writes openapi.json for the frontend's typed client: `pnpm openapi`.
writeFileSync("openapi.json", `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`);
console.log("Wrote openapi.json");
process.exit(0);
