#!/usr/bin/env node
/* global fetch, AbortSignal */
/**
 * Synthetic Uptime & Health Monitor (GAP-033 / S-019)
 * Probes API and Storefront endpoints, reports SLA metrics, and validates system telemetry.
 */

import { performance } from 'perf_hooks';

const PROBES = [
  { name: 'API Liveness', url: 'http://localhost:3001/api/v1/health/liveness', target: 'api', critical: true },
  { name: 'API Readiness', url: 'http://localhost:3001/api/v1/health/readiness', target: 'api', critical: true },
  { name: 'API Telemetry', url: 'http://localhost:3001/api/v1/health/telemetry', target: 'api', critical: false },
  { name: 'Storefront Root', url: 'http://localhost:3000/', target: 'storefront', critical: true },
  { name: 'Storefront Products', url: 'http://localhost:3000/products', target: 'storefront', critical: false },
  { name: 'Storefront Customer Account', url: 'http://localhost:3000/account', target: 'storefront', critical: false },
  { name: 'Storefront Order Tracker', url: 'http://localhost:3000/orders', target: 'storefront', critical: false },
];

export async function runSyntheticProbes() {
  console.log('===============================================================');
  console.log('   BRAND COMMERCE PLATFORM — SYNTHETIC UPTIME & SLA MONITOR    ');
  console.log(`   Timestamp: ${new Date().toISOString()}                      `);
  console.log('===============================================================\n');

  const results = [];
  let allHealthy = true;

  for (const probe of PROBES) {
    const start = performance.now();
    let status = 0;
    let ok = false;
    let error = null;
    let data = null;

    try {
      const res = await fetch(probe.url, { signal: AbortSignal.timeout(5000) });
      status = res.status;
      ok = res.ok;
      if (probe.url.includes('/telemetry')) {
        try {
          data = await res.json();
        } catch {
          // ignore
        }
      }
    } catch (err) {
      error = err.message;
      ok = false;
    }

    const durationMs = Math.round(performance.now() - start);

    if (probe.critical && !ok) {
      allHealthy = false;
    }

    results.push({
      name: probe.name,
      url: probe.url,
      ok,
      status,
      durationMs,
      error,
      data,
    });

    const statusBadge = ok ? `\x1b[32m[PASS ${status}]\x1b[0m` : `\x1b[31m[FAIL ${status || 'ERR'}]\x1b[0m`;
    const latencyStr = `${durationMs}ms`.padStart(6);
    console.log(`  ${statusBadge} ${probe.name.padEnd(28)} - ${latencyStr} ${error ? `(${error})` : ''}`);
  }

  // Latency metrics
  const latencies = results.filter((r) => r.ok).map((r) => r.durationMs).sort((a, b) => a - b);
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1] : 0;

  console.log('\n---------------------------------------------------------------');
  console.log(`  Overall Status:   ${allHealthy ? '\x1b[32mHEALTHY (100% Core Availability)\x1b[0m' : '\x1b[31mDEGRADED\x1b[0m'}`);
  console.log(`  Average Latency:  ${avgLatency}ms (p95: ${p95Latency}ms)`);

  const telemetry = results.find((r) => r.data)?.data;
  if (telemetry && telemetry.memory) {
    console.log(`  Process Uptime:   ${telemetry.uptime}s | Node: ${telemetry.nodeVersion}`);
    console.log(`  Memory (RSS):     ${telemetry.memory.rssMb} MB (Heap: ${telemetry.memory.heapUsedMb} MB / ${telemetry.memory.heapTotalMb} MB)`);
    console.log(`  Database Status:  ${telemetry.database.toUpperCase()}`);
  }
  console.log('---------------------------------------------------------------\n');

  return {
    timestamp: new Date().toISOString(),
    allHealthy,
    avgLatency,
    p95Latency,
    results,
    telemetry,
  };
}

if (process.argv[1] && process.argv[1].endsWith('health-monitor.mjs')) {
  runSyntheticProbes()
    .then((summary) => {
      if (!summary.allHealthy) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Monitor Failure]:', err);
      process.exit(1);
    });
}
