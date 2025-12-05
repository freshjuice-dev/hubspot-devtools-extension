#!/usr/bin/env node

/**
 * Chrome Extension Validator
 * Validates manifest.json structure and required files
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist', 'chrome');

const errors = [];
const warnings = [];

function error(msg) {
  errors.push(`❌ ${msg}`);
}

function warn(msg) {
  warnings.push(`⚠️  ${msg}`);
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

async function validateManifest() {
  const manifestPath = path.join(distDir, 'manifest.json');

  if (!await fs.pathExists(manifestPath)) {
    error('manifest.json not found. Run build:chrome first.');
    return null;
  }

  const manifest = await fs.readJson(manifestPath);

  // Check manifest version
  if (manifest.manifest_version !== 3) {
    error(`Expected manifest_version 3, got ${manifest.manifest_version}`);
  } else {
    success('Manifest version 3');
  }

  // Required fields
  const requiredFields = ['name', 'version', 'description'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      error(`Missing required field: ${field}`);
    }
  }
  success('Required fields present');

  // Version format
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    warn(`Version "${manifest.version}" should be in format X.Y.Z`);
  }

  // Name length
  if (manifest.name && manifest.name.length > 45) {
    warn(`Name exceeds 45 characters (${manifest.name.length})`);
  }

  // Description length
  if (manifest.description && manifest.description.length > 132) {
    warn(`Description exceeds 132 characters (${manifest.description.length})`);
  }

  return manifest;
}

async function validateIcons(manifest) {
  if (!manifest) return;

  const iconSizes = ['16', '32', '48', '128'];

  // Check manifest icons
  if (manifest.icons) {
    for (const size of iconSizes) {
      if (manifest.icons[size]) {
        const iconPath = path.join(distDir, manifest.icons[size]);
        if (!await fs.pathExists(iconPath)) {
          error(`Icon not found: ${manifest.icons[size]}`);
        }
      }
    }
    success('Manifest icons validated');
  } else {
    warn('No icons defined in manifest');
  }

  // Check action icons
  if (manifest.action?.default_icon) {
    for (const [size, iconFile] of Object.entries(manifest.action.default_icon)) {
      const iconPath = path.join(distDir, iconFile);
      if (!await fs.pathExists(iconPath)) {
        error(`Action icon not found: ${iconFile}`);
      }
    }
    success('Action icons validated');
  }
}

async function validateBackgroundScript(manifest) {
  if (!manifest) return;

  if (manifest.background?.service_worker) {
    const swPath = path.join(distDir, manifest.background.service_worker);
    if (!await fs.pathExists(swPath)) {
      error(`Service worker not found: ${manifest.background.service_worker}`);
    } else {
      success('Service worker exists');
    }
  } else {
    warn('No background service worker defined');
  }
}

async function validateContentScripts(manifest) {
  if (!manifest) return;

  if (manifest.content_scripts) {
    for (const cs of manifest.content_scripts) {
      if (cs.js) {
        for (const jsFile of cs.js) {
          const jsPath = path.join(distDir, jsFile);
          if (!await fs.pathExists(jsPath)) {
            error(`Content script not found: ${jsFile}`);
          }
        }
      }
    }
    success('Content scripts validated');
  }
}

async function validatePopup(manifest) {
  if (!manifest) return;

  if (manifest.action?.default_popup) {
    const popupPath = path.join(distDir, manifest.action.default_popup);
    if (!await fs.pathExists(popupPath)) {
      error(`Popup not found: ${manifest.action.default_popup}`);
    } else {
      success('Popup exists');
    }
  }
}

async function validatePermissions(manifest) {
  if (!manifest) return;

  const dangerousPermissions = [
    'debugger',
    'pageCapture',
    'privacy',
    'proxy',
    'tts',
    'ttsEngine',
    'webAuthenticationProxy'
  ];

  const permissions = [...(manifest.permissions || []), ...(manifest.host_permissions || [])];

  for (const perm of permissions) {
    if (dangerousPermissions.includes(perm)) {
      warn(`Potentially dangerous permission: ${perm}`);
    }
  }
  success('Permissions checked');
}

async function validateNoInlineScripts() {
  const htmlFiles = ['popup/popup.html', 'options/options.html'];

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(distDir, htmlFile);
    if (await fs.pathExists(htmlPath)) {
      const content = await fs.readFile(htmlPath, 'utf-8');

      // Check for inline scripts (not allowed in MV3)
      if (/<script[^>]*>(?!\s*<\/script>)/.test(content) && !/<script[^>]*src=/.test(content)) {
        if (content.match(/<script[^>]*>[^<]+<\/script>/)) {
          error(`Inline script found in ${htmlFile} (not allowed in MV3)`);
        }
      }

      // Check for inline event handlers
      if (/\son\w+\s*=/.test(content)) {
        error(`Inline event handler found in ${htmlFile} (not allowed in MV3)`);
      }
    }
  }
  success('No inline scripts detected');
}

async function main() {
  console.log('\n🔍 Chrome Extension Validator\n');
  console.log('=' .repeat(40) + '\n');

  if (!await fs.pathExists(distDir)) {
    error('dist/chrome/ not found. Run npm run build:chrome first.');
    console.log('\n' + errors.join('\n'));
    process.exit(1);
  }

  const manifest = await validateManifest();
  await validateIcons(manifest);
  await validateBackgroundScript(manifest);
  await validateContentScripts(manifest);
  await validatePopup(manifest);
  await validatePermissions(manifest);
  await validateNoInlineScripts();

  console.log('\n' + '=' .repeat(40));

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(w));
  }

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(e));
    console.log(`\n❌ Validation failed with ${errors.length} error(s)\n`);
    process.exit(1);
  }

  console.log(`\n✅ Chrome extension validation passed!\n`);
}

main().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});