/**
 * CycloneDX v1.5 Software Bill of Materials (SBOM) Generator (TASK-190).
 * Generates docs/governance/SBOM.cdx.json from monorepo package tree and dependencies.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

async function main() {
  console.log('Generating CycloneDX 1.5 Software Bill of Materials (SBOM)...');

  const rootPkgRaw = await readFile(resolve('package.json'), 'utf8');
  const rootPkg = JSON.parse(rootPkgRaw);

  let lockfileRaw = '';
  try {
    lockfileRaw = await readFile(resolve('package-lock.json'), 'utf8');
  } catch {
    console.warn('package-lock.json not found; reading top-level packages.');
  }

  const lockfile = lockfileRaw ? JSON.parse(lockfileRaw) : { packages: {} };

  const components = [];
  const processed = new Set();

  // Add monorepo workspaces as primary components
  const workspaces = [
    { name: '@bc/contracts', path: 'packages/contracts', description: 'Canonical Zod schemas and wire contracts' },
    { name: '@bc/domain', path: 'packages/domain', description: 'Pure domain business logic and state machines' },
    { name: '@bc/database', path: 'packages/database', description: 'Prisma schema and PostgreSQL migrations' },
    { name: '@bc/api', path: 'apps/api', description: 'NestJS modular monolith REST API service' },
    { name: '@bc/storefront', path: 'apps/storefront', description: 'Next.js 15 App Router luxury brand storefront' },
  ];

  for (const ws of workspaces) {
    try {
      const wsPkg = JSON.parse(await readFile(resolve(ws.path, 'package.json'), 'utf8'));
      components.push({
        type: 'application',
        'bom-ref': `pkg:npm/${ws.name}@${wsPkg.version || '0.1.0'}`,
        name: ws.name,
        version: wsPkg.version || '0.1.0',
        description: ws.description,
        scope: 'required',
        licenses: [{ license: { id: 'UNLICENSED' } }],
        purl: `pkg:npm/${encodeURIComponent(ws.name)}@${wsPkg.version || '0.1.0'}`,
      });
      processed.add(ws.name);
    } catch (e) {
      console.warn(`Could not read workspace ${ws.name}: ${e.message}`);
    }
  }

  // Parse external dependencies from package-lock.json
  const packagesMap = lockfile.packages || {};
  for (const [pkgPath, pkgInfo] of Object.entries(packagesMap)) {
    if (!pkgPath || pkgPath === '') continue; // Skip root
    const cleanName = pkgPath.replace(/^node_modules\//, '').replace(/^.*node_modules\//, '');
    if (processed.has(cleanName)) continue;
    processed.add(cleanName);

    const version = pkgInfo.version || 'unknown';
    const license = pkgInfo.license || 'UNKNOWN';

    components.push({
      type: 'library',
      'bom-ref': `pkg:npm/${cleanName}@${version}`,
      name: cleanName,
      version: version,
      scope: pkgInfo.dev ? 'optional' : 'required',
      licenses: [{ license: { id: license } }],
      purl: `pkg:npm/${encodeURIComponent(cleanName)}@${version}`,
    });
  }

  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: 'DERMAVIA Brand Commerce',
          name: 'DermaVia-SBOM-Generator',
          version: '1.0.0',
        },
      ],
      component: {
        type: 'application',
        name: rootPkg.name || 'brand-commerce',
        version: rootPkg.version || '0.1.0',
        description: rootPkg.description,
      },
    },
    components,
  };

  const outputPath = resolve('docs/governance/SBOM.cdx.json');
  await writeFile(outputPath, JSON.stringify(sbom, null, 2) + '\n', 'utf8');

  console.log(`[SUCCESS] CycloneDX SBOM generated: ${outputPath}`);
  console.log(`Total components cataloged: ${components.length}`);
}

main().catch((err) => {
  console.error('Failed to generate SBOM:', err);
  process.exit(1);
});
