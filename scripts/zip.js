#!/usr/bin/env node

/**
 * Zip script for HubSpot DevTools extension
 * Creates distributable zip files for Chrome and Firefox stores
 */

import fs from 'fs-extra';
import path from 'path';
import { ZipArchive } from 'archiver';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const targetArg = args.find(a => a.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'all';

const TARGETS = target === 'all' ? ['chrome', 'firefox'] : [target];

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

/**
 * Create zip file for a specific target
 * @param {string} target - 'chrome' or 'firefox'
 */
async function zipTarget(target) {
  const distDir = path.join(DIST_DIR, target);

  // Check if dist exists
  if (!await fs.pathExists(distDir)) {
    console.error(`❌ dist/${target}/ not found. Run build first.`);
    process.exit(1);
  }

  // Get version from package.json
  const pkg = await fs.readJson(path.join(ROOT_DIR, 'package.json'));
  const zipName = `hubspot-devtools-${target}-v${pkg.version}.zip`;
  const zipPath = path.join(DIST_DIR, zipName);

  // Remove existing zip if present
  if (await fs.pathExists(zipPath)) {
    await fs.remove(zipPath);
  }

  const output = fs.createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2);
      console.log(`📦 Created ${zipName} (${sizeKB} KB)`);
      resolve();
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
      } else {
        reject(err);
      }
    });

    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

/**
 * Main function
 */
async function main() {
  console.log('📦 HubSpot DevTools Zip Script');
  console.log('==============================\n');

  for (const t of TARGETS) {
    await zipTarget(t);
  }

  console.log('\n✅ All packages created successfully!');
}

main().catch(err => {
  console.error('❌ Zip failed:', err);
  process.exit(1);
});