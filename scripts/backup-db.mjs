#!/usr/bin/env node
/**
 * Automated PostgreSQL Database Backup Script (GAP-032 / S-020)
 * Uses pg_dump from PostgreSQL installation to produce clean, reproducible SQL dumps.
 */

import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Locate pg_dump binary
function findPgDump() {
  // Check PATH first
  try {
    const res = spawnSync('pg_dump', ['--version'], { stdio: 'pipe' });
    if (res.status === 0) return 'pg_dump';
  } catch {
    // not in PATH
  }

  // Common Windows PostgreSQL locations
  const candidates = [
    'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
    'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('pg_dump executable could not be found in PATH or standard installation directories.');
}

// 2. Parse DATABASE_URL from .env
function getDbConfig() {
  const envPath = path.join(rootDir, '.env');
  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl && fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        dbUrl = trimmed.substring('DATABASE_URL='.length).trim();
        break;
      }
    }
  }

  if (!dbUrl) {
    throw new Error('DATABASE_URL not found in environment or .env file');
  }

  const parsed = new URL(dbUrl);
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port || '5432',
    user: decodeURIComponent(parsed.username || 'postgres'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname.replace(/^\//, '') || 'brand_commerce',
  };
}

export function performBackup(customOutputFile) {
  const pgDumpPath = findPgDump();
  const config = getDbConfig();

  const backupsDir = path.join(rootDir, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const outputFile = customOutputFile || path.join(backupsDir, `brand_commerce_backup_${timestamp}.sql`);

  console.log(`[Backup] Starting PostgreSQL backup using ${pgDumpPath}...`);
  console.log(`[Backup] Target Database: ${config.database}@${config.host}:${config.port}`);

  const args = [
    '-h', config.host,
    '-p', config.port,
    '-U', config.user,
    '-d', config.database,
    '--no-owner',
    '--clean',
    '--if-exists',
    '-f', outputFile,
  ];

  const env = {
    ...process.env,
    PGPASSWORD: config.password,
  };

  const startTime = Date.now();
  execFileSync(pgDumpPath, args, { env, stdio: 'inherit' });
  const duration = Date.now() - startTime;

  if (!fs.existsSync(outputFile)) {
    throw new Error(`Backup file was not created: ${outputFile}`);
  }

  const stats = fs.statSync(outputFile);
  if (stats.size === 0) {
    throw new Error(`Backup file is empty: ${outputFile}`);
  }

  // Quick verification: check if key tables exist in dump
  const sample = fs.readFileSync(outputFile, 'utf8').slice(0, 50000);
  const verifiedTables = ['Product', 'Category', 'Order', 'InventoryItem'].filter((t) => sample.includes(`"${t}"`) || sample.includes(t));

  console.log(`[Backup] Completed successfully in ${duration}ms!`);
  console.log(`[Backup] File: ${outputFile}`);
  console.log(`[Backup] Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`[Backup] Verified sample tables in dump: ${verifiedTables.join(', ')}`);

  return {
    outputFile,
    sizeBytes: stats.size,
    durationMs: duration,
    verifiedTables,
    config,
  };
}

// If run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    performBackup();
  } catch (err) {
    console.error('[Backup Error]:', err.message);
    process.exit(1);
  }
}
