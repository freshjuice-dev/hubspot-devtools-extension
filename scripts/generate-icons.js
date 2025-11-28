#!/usr/bin/env node

/**
 * Generate icons for HubSpot DevTools extension
 *
 * Usage:
 *   node scripts/generate-icons.js                    # Generate placeholder icons
 *   node scripts/generate-icons.js icon.png           # Resize from PNG source
 *   node scripts/generate-icons.js icon.svg           # Resize from SVG source
 *   node scripts/generate-icons.js --input=icon.png   # Alternative syntax
 */

const fs = require('fs-extra');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'src', 'assets', 'icons');
const SIZES = [16, 32, 48, 128];

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let inputFile = null;

  for (const arg of args) {
    if (arg.startsWith('--input=')) {
      inputFile = arg.split('=')[1];
    } else if (!arg.startsWith('-') && (arg.endsWith('.png') || arg.endsWith('.svg'))) {
      inputFile = arg;
    }
  }

  return { inputFile };
}

/**
 * Generate icons from source image using sharp
 */
async function generateFromSource(inputFile) {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('❌ "sharp" package is required for resizing images.');
    console.error('   Install it with: npm install sharp --save-dev\n');
    console.error('   Or run without arguments to generate placeholder icons.');
    process.exit(1);
  }

  const inputPath = path.resolve(inputFile);

  if (!await fs.pathExists(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`📁 Source: ${inputPath}\n`);

  await fs.ensureDir(ICONS_DIR);

  for (const size of SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}.png`);

    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`✅ Created icon-${size}.png (${size}x${size})`);
  }
}

/**
 * Generate placeholder icons (no dependencies required)
 */
async function generatePlaceholders() {
  console.log('📝 Generating placeholder icons...\n');

  await fs.ensureDir(ICONS_DIR);

  for (const size of SIZES) {
    createPlaceholderIcon(size, `icon-${size}.png`);
  }

  console.log('\n💡 Tip: Pass your own icon to generate production icons:');
  console.log('   node scripts/generate-icons.js your-icon.png');
  console.log('   node scripts/generate-icons.js your-icon.svg');
}

/**
 * Create a placeholder PNG icon
 */
function createPlaceholderIcon(size, filename) {
  const zlib = require('zlib');

  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // Create IHDR chunk
  const ihdr = createIHDR(size, size);

  // Create image data
  const imageData = createImageData(size);

  // Create IDAT chunk (compressed image data)
  const compressed = zlib.deflateSync(imageData);
  const idat = createChunk('IDAT', compressed);

  // Create IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  // Combine all parts
  const png = Buffer.concat([signature, ihdr, idat, iend]);

  const filepath = path.join(ICONS_DIR, filename);
  fs.writeFileSync(filepath, png);
  console.log(`✅ Created ${filename} (${size}x${size}) - placeholder`);
}

function createIHDR(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8);  // bit depth
  data.writeUInt8(6, 9);  // color type (RGBA)
  data.writeUInt8(0, 10); // compression
  data.writeUInt8(0, 11); // filter
  data.writeUInt8(0, 12); // interlace

  return createChunk('IHDR', data);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(data) {
  let crc = 0xffffffff;
  const table = makeCrcTable();

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

function createImageData(size) {
  const rows = [];

  // HubSpot orange: #ff7a59
  const bgR = 255, bgG = 122, bgB = 89, bgA = 255;
  // White for icon
  const fgR = 255, fgG = 255, fgB = 255, fgA = 255;

  for (let y = 0; y < size; y++) {
    const row = [0]; // Filter byte (none)

    for (let x = 0; x < size; x++) {
      const isIcon = isWrenchPixel(x, y, size);

      if (isIcon) {
        row.push(fgR, fgG, fgB, fgA);
      } else {
        row.push(bgR, bgG, bgB, bgA);
      }
    }

    rows.push(Buffer.from(row));
  }

  return Buffer.concat(rows);
}

function isWrenchPixel(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;

  const nx = (x - cx) / (size / 2);
  const ny = (y - cy) / (size / 2);

  // Wrench head (circle)
  const headRadius = 0.35;
  const headX = -0.25;
  const headY = -0.25;
  const distHead = Math.sqrt(Math.pow(nx - headX, 2) + Math.pow(ny - headY, 2));

  if (distHead < headRadius) {
    if (distHead < headRadius * 0.4) {
      return false;
    }
    return true;
  }

  // Handle (diagonal line)
  const handleAngle = Math.PI / 4;
  const handleWidth = 0.18;

  const rotX = nx * Math.cos(handleAngle) + ny * Math.sin(handleAngle);
  const rotY = -nx * Math.sin(handleAngle) + ny * Math.cos(handleAngle);

  if (rotY > -0.1 && rotY < 0.55 && Math.abs(rotX) < handleWidth / 2) {
    return true;
  }

  return false;
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 HubSpot DevTools Icon Generator\n');

  const { inputFile } = parseArgs();

  if (inputFile) {
    await generateFromSource(inputFile);
  } else {
    await generatePlaceholders();
  }

  console.log('\n✅ Icons generated successfully!');
}

main().catch(err => {
  console.error('❌ Icon generation failed:', err);
  process.exit(1);
});
