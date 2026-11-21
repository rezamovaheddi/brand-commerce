/**
 * Exports the live OpenAPI document from the running API to apps/api/openapi.json.
 * Usage: start the API (npm run api:dev or node apps/api/dist/main.js), then
 * `npm run openapi:export`. CI (GAP-004) can run this after the smoke step and
 * upload the artifact so contract diffs are reviewable.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = process.env.API_URL || "http://localhost:3001";
// Node 22 exposes global fetch; declared for the lint environment.
const doFetch = globalThis.fetch;
const res = await doFetch(`${base}/docs-json`);
if (!res.ok) {
  console.error(`openapi export failed: HTTP ${res.status} from ${base}/docs-json`);
  process.exit(1);
}
const spec = await res.json();
const out = resolve("apps/api/openapi.json");
await writeFile(out, JSON.stringify(spec, null, 2) + "\n", "utf8");
console.log(`openapi.json written: ${out} (${Object.keys(spec.paths ?? {}).length} paths)`);
