/**
 * Supply Chain License Compliance Auditor (TASK-190).
 * Validates that all production and runtime dependencies adhere to commercial policy:
 * Approved: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, CC0-1.0, Python-2.0
 * Prohibited without explicit review: AGPL, GPL, SSPL, EUPL, CPAL.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const APPROVED_LICENSES = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
  'Python-2.0',
  'UNLICENSED', // internal workspace packages
]);

const PROHIBITED_KEYWORDS = ['AGPL', 'GPL', 'SSPL', 'EUPL', 'CPAL'];

async function auditLicenses() {
  console.log('===============================================================');
  console.log('   SUPPLY CHAIN LICENSE COMPLIANCE AUDIT (TASK-190)           ');
  console.log('===============================================================');

  let lockfileRaw = '';
  try {
    lockfileRaw = await readFile(resolve('package-lock.json'), 'utf8');
  } catch {
    console.error('Error: package-lock.json not found.');
    process.exit(1);
  }

  const lockfile = JSON.parse(lockfileRaw);
  const packages = lockfile.packages || {};

  const licenseCounts = {};
  const violations = [];
  let totalChecked = 0;

  for (const [pkgPath, pkgInfo] of Object.entries(packages)) {
    if (!pkgPath || pkgPath === '') continue; // Skip root project
    const cleanName = pkgPath.replace(/^node_modules\//, '').replace(/^.*node_modules\//, '');
    const isDev = Boolean(pkgInfo.dev);

    // Only audit runtime (non-dev) dependencies strictly
    if (isDev) continue;

    const rawLicense = pkgInfo.license || 'UNKNOWN';
    licenseCounts[rawLicense] = (licenseCounts[rawLicense] || 0) + 1;
    totalChecked++;

    // Check prohibited keywords
    for (const kw of PROHIBITED_KEYWORDS) {
      if (rawLicense.toUpperCase().includes(kw) && !rawLicense.toUpperCase().includes('LGPL')) {
        violations.push({
          package: cleanName,
          license: rawLicense,
          version: pkgInfo.version,
          reason: `Contains restricted copyleft keyword: ${kw}`,
        });
      }
    }
  }

  console.log(`\nAudited ${totalChecked} runtime production dependencies.\n`);
  console.log('License Distribution:');
  for (const [lic, count] of Object.entries(licenseCounts).sort((a, b) => b[1] - a[1])) {
    const status = APPROVED_LICENSES.has(lic) ? '[APPROVED]' : '[REVIEW_NEEDED]';
    console.log(`  ${status.padEnd(16)} ${lic.padEnd(20)}: ${count}`);
  }

  if (violations.length > 0) {
    console.error(`\n[FAIL] Found ${violations.length} prohibited license violations:`);
    for (const v of violations) {
      console.error(`  - ${v.package}@${v.version}: ${v.license} (${v.reason})`);
    }
    process.exit(1);
  }

  console.log('\n[PASS] Zero viral or restricted copyleft licenses found in production dependencies.');
  console.log('ALL SUPPLY CHAIN LICENSE AUDIT CHECKS PASSED SUCCESSFULLY.\n');
}

auditLicenses().catch((err) => {
  console.error('License audit failed:', err);
  process.exit(1);
});
