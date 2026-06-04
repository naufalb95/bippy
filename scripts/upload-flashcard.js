#!/usr/bin/env node
// Upload a flashcard video to Vercel Blob and print the public URL ready
// to paste into src/flashcards.ts.
//
// Usage:
//   node scripts/upload-flashcard.js ./elephant.mp4
//   node scripts/upload-flashcard.js ./giraffe.mp4 --name "Giraffe"
//
// Requires BLOB_READ_WRITE_TOKEN in .env.local.

const fs = require('fs');
const path = require('path');

// .env.local first so it wins over .env.
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { put } = require('@vercel/blob');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--name') args.name = argv[++i];
    else if (a === '--id') args.id = argv[++i];
    else args._.push(a);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const filePath = args._[0];

if (!filePath) {
  console.error('Usage: node scripts/upload-flashcard.js <video-path> [--name "Display Name"] [--id <uuid>]');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN not set. Add it to .env.local.');
  process.exit(1);
}

const baseName = path.basename(filePath);
const ext = path.extname(filePath).toLowerCase();
const dest = `flashcards/videos/${Date.now()}-${baseName}`;

const contentType = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
}[ext] || 'application/octet-stream';

(async () => {
  console.log(`Uploading ${filePath} (${formatBytes(fs.statSync(filePath).size)}) to ${dest}...`);

  const buf = fs.readFileSync(filePath);
  const result = await put(dest, buf, {
    access: 'public',
    token,
    contentType,
    addRandomSuffix: false,
  });

  console.log('');
  console.log('✓ Uploaded.');
  console.log('  URL:    ', result.url);
  console.log('');
  console.log('Paste this into FLASHCARDS in src/flashcards.ts:');
  console.log('');

  const id = args.id || crypto.randomUUID();
  const name = args.name || 'Untitled';
  console.log(`  '${id}': {`);
  console.log(`    id: '${id}',`);
  console.log(`    name: '${name}',`);
  console.log(`    video: '${result.url}',`);
  console.log(`  },`);
  console.log('');
})().catch((e) => {
  console.error('Upload failed:', e.message || e);
  process.exit(1);
});

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
