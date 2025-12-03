#!/usr/bin/env node

/**
 * Build script for HubSpot DevTools extension
 * Builds for Chrome (MV3) and Firefox (MV2)
 */

const fs = require('fs-extra');
const path = require('path');

const args = process.argv.slice(2);
const targetArg = args.find(a => a.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'all';
const watch = args.includes('--watch');

const TARGETS = target === 'all' ? ['chrome', 'firefox'] : [target];

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

/**
 * Build extension for a specific target
 * @param {string} target - 'chrome' or 'firefox'
 */
async function build(target) {
  console.log(`\nBuilding for ${target}...`);

  const distDir = path.join(DIST_DIR, target);

  // Clean and create dist directory
  await fs.emptyDir(distDir);

  // Copy common source files (including unified background script)
  const filesToCopy = ['popup', 'options', 'content', 'lib', 'assets', 'background'];

  for (const dir of filesToCopy) {
    const srcPath = path.join(SRC_DIR, dir);
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, path.join(distDir, dir));
    }
  }

  // Merge manifests
  const baseManifest = await fs.readJson(path.join(SRC_DIR, 'manifest', 'base.json'));
  const targetManifest = await fs.readJson(path.join(SRC_DIR, 'manifest', `${target}.json`));

  // Deep merge manifests
  const finalManifest = deepMerge(baseManifest, targetManifest);

  await fs.writeJson(path.join(distDir, 'manifest.json'), finalManifest, { spaces: 2 });

  console.log(`✅ Built ${target} extension in dist/${target}/`);
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} - Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Main build function
 */
async function main() {
  console.log('🔨 HubSpot DevTools Build Script');
  console.log('================================');

  for (const t of TARGETS) {
    await build(t);
  }

  if (watch) {
    const chokidar = require('chokidar');
    console.log('\n👀 Watching for changes...\n');

    const watcher = chokidar.watch(path.join(SRC_DIR, '**/*'), {
      ignoreInitial: true,
      ignored: /node_modules/
    });

    watcher.on('all', async (event, filePath) => {
      console.log(`\n🔄 ${event}: ${path.relative(ROOT_DIR, filePath)}`);
      for (const t of TARGETS) {
        await build(t);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n👋 Stopping watch mode...');
      watcher.close();
      process.exit(0);
    });
  }
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
