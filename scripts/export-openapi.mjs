/* global AbortSignal */
/**
 * Exports the live OpenAPI document from the running API to apps/api/openapi.json.
 * Usage: start the API (npm run api:dev or node apps/api/dist/main.js), then
 * `npm run openapi:export`. CI (GAP-004) can run this after the smoke step and
 * upload the artifact so contract diffs are reviewable.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = process.env.API_URL || "http://localhost:3001";
const doFetch = globalThis.fetch;

let exported = false;

try {
  const res = await doFetch(`${base}/docs-json`, { signal: AbortSignal.timeout(3000) });
  if (res.ok) {
    const spec = await res.json();
    const out = resolve("apps/api/openapi.json");
    await writeFile(out, JSON.stringify(spec, null, 2) + "\n", "utf8");
    console.log(`openapi.json written from live API: ${out} (${Object.keys(spec.paths ?? {}).length} paths)`);
    exported = true;
  }
} catch {
  // Live fetch failed, fallback to offline generator
}

if (!exported) {
  console.log("Live API endpoint not reachable, generating OpenAPI document offline...");
  const { execFileSync } = await import("node:child_process");
  execFileSync("node", ["scripts/generate-openapi.mjs"], { stdio: "inherit" });
}
