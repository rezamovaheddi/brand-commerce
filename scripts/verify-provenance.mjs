/**
 * Build Provenance & Artifact Attestation Verifier (TASK-192).
 * Computes and verifies cryptographic SHA-256 digests for key release artifacts:
 * - apps/api/openapi.json (OpenAPI 3.0 REST specification)
 * - docs/governance/SBOM.cdx.json (CycloneDX 1.5 Software Bill of Materials)
 * - graphify-out/graph.json (Architecture dependency graph data)
 * - packages/database/prisma/schema.prisma (Database schema contract)
 * - tokens/brand.tokens.json (DTCG 2025.10 design tokens)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const ARTIFACT_FILES = [
  'apps/api/openapi.json',
  'docs/governance/SBOM.cdx.json',
  'graphify-out/graph.json',
  'packages/database/prisma/schema.prisma',
  'tokens/brand.tokens.json',
];

const MANIFEST_PATH = resolve('docs/governance/PROVENANCE_MANIFEST.sha256');

async function computeSha256(filePath) {
  const content = await readFile(resolve(filePath));
  return createHash('sha256').update(content).digest('hex');
}

function getGitCommitSha() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown-commit';
  }
}

async function runProvenance() {
  const args = process.argv.slice(2);
  const isCheckMode = args.includes('--check');

  console.log('===============================================================');
  console.log('   BUILD PROVENANCE & ARTIFACT ATTESTATION (TASK-192)          ');
  console.log('===============================================================');

  const commitSha = getGitCommitSha();
  console.log(`Git Commit SHA:   ${commitSha}`);
  console.log(`Execution Mode:   ${isCheckMode ? 'VERIFY (--check)' : 'GENERATE'}\n`);

  if (isCheckMode) {
    let manifestContent = '';
    try {
      manifestContent = await readFile(MANIFEST_PATH, 'utf8');
    } catch {
      console.error(`[ERROR] Provenance manifest not found at: ${MANIFEST_PATH}`);
      process.exit(1);
    }

    const lines = manifestContent.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    let verifiedCount = 0;
    const errors = [];

    for (const line of lines) {
      const [expectedHash, relativePath] = line.trim().split(/\s+/);
      try {
        const actualHash = await computeSha256(relativePath);
        if (actualHash.toLowerCase() === expectedHash.toLowerCase()) {
          console.log(`[PASS] ${relativePath} (${actualHash.substring(0, 16)}...)`);
          verifiedCount++;
        } else {
          errors.push(`Digest mismatch on ${relativePath}: expected ${expectedHash}, got ${actualHash}`);
        }
      } catch (err) {
        errors.push(`Could not read ${relativePath}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      console.error('\n[FAIL] Artifact provenance integrity check failed:');
      for (const e of errors) {
        console.error(`  - ${e}`);
      }
      process.exit(1);
    }

    console.log(`\nALL ${verifiedCount} RELEASE ARTIFACTS VERIFIED SUCCESSFULLY.`);
  } else {
    const lines = [
      `# Brand Commerce Release Artifact Provenance Manifest`,
      `# Commit: ${commitSha}`,
      `# Timestamp: ${new Date().toISOString()}`,
      `# Format: <sha256>  <relative_path>`,
      '',
    ];

    for (const file of ARTIFACT_FILES) {
      try {
        const hash = await computeSha256(file);
        lines.push(`${hash}  ${file}`);
        console.log(`[GENERATED] ${hash}  ${file}`);
      } catch (e) {
        console.warn(`[WARN] Skipping ungenerated file ${file}: ${e.message}`);
      }
    }

    await writeFile(MANIFEST_PATH, lines.join('\n') + '\n', 'utf8');
    console.log(`\n[SUCCESS] Saved provenance manifest to: ${MANIFEST_PATH}`);
  }
}

runProvenance().catch((err) => {
  console.error('Provenance task failed:', err);
  process.exit(1);
});
