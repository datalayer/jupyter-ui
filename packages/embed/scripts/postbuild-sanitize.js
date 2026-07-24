#!/usr/bin/env node
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2];

if (!targetDir) {
  console.error('[sanitize] Missing target directory argument.');
  process.exit(1);
}

const root = path.resolve(process.cwd(), targetDir);

if (!fs.existsSync(root)) {
  console.warn(`[sanitize] Directory not found: ${root}`);
  process.exit(0);
}

const JS_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

const REPLACEMENTS = [
  {
    pattern: /require\("\.\.\/package\.json"\)\.version/g,
    replacement: '"5.0.12"',
    label: 'double-quote require',
  },
  {
    pattern: /require\('\.\.\/package\.json'\)\.version/g,
    replacement: '"5.0.12"',
    label: 'single-quote require',
  },
];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (JS_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

let changedFiles = 0;
let totalReplacements = 0;
const jsFiles = walk(root);

for (const filePath of jsFiles) {
  const original = fs.readFileSync(filePath, 'utf8');
  let next = original;
  let fileReplacements = 0;

  for (const { pattern } of REPLACEMENTS) {
    const matches = next.match(pattern);
    if (matches && matches.length > 0) {
      fileReplacements += matches.length;
      next = next.replace(pattern, '"5.0.12"');
    }
  }

  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, next, 'utf8');
    changedFiles += 1;
    totalReplacements += fileReplacements;
    console.log(`[sanitize] patched ${filePath} (${fileReplacements} replacement(s))`);
  }
}

console.log(
  `[sanitize] done: ${changedFiles} file(s) patched, ${totalReplacements} replacement(s) in ${root}`,
);
