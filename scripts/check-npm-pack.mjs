#!/usr/bin/env node
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Refuses a package whose tarball does not carry what its `lib/` imports.
 *
 * Lists the tarball with `npm pack --dry-run --json` and reads every
 * `lib/**\/*.js` in it: each relative specifier must name a file the
 * tarball carries, written whole (`'./approvals.js'`, not `'./approvals'`:
 * Node's ESM loader adds no extension and looks up no `index.js`). And no
 * two files of the tarball may have paths that differ only in case: on a
 * case-insensitive file system (macOS, Windows) one overwrites the other
 * when the package is installed (`voice/HandsFree.js` and
 * `voice/handsFree.js` did). Prints each refusal and exits 1. Run it after
 * the build and before `npm pack`.
 *
 * Usage: node scripts/check-npm-pack.mjs
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relativeSpecifiers, resolveSpecifier } from './esm-specifiers.mjs';

const listing = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  }),
);
const packed = new Set(listing[0].files.map(({ path }) => path));
const isFile = path => packed.has(path);

const refused = [];

const byFolded = new Map();
for (const path of packed) {
  const folded = path.toLowerCase();
  const other = byFolded.get(folded);
  if (other) {
    refused.push(`${other} and ${path} differ only in case`);
  } else {
    byFolded.set(folded, path);
  }
}

let read = 0;
let specifiers = 0;
for (const file of [...packed].filter(
  path => path.startsWith('lib/') && path.endsWith('.js'),
)) {
  read += 1;
  for (const { specifier } of relativeSpecifiers(readFileSync(file, 'utf8'))) {
    specifiers += 1;
    const { status, whole } = resolveSpecifier(file, specifier, isFile);
    if (status === 'missing') {
      refused.push(`${file}: '${specifier}' names no file in the tarball`);
    } else if (status === 'partial') {
      refused.push(
        `${file}: '${specifier}' is not written whole (Node needs '${whole}')`,
      );
    }
  }
}
console.log(
  `check-npm-pack: ${listing[0].name}@${listing[0].version}, ${packed.size} files, ${specifiers} relative specifiers in ${read} lib/ modules`,
);
if (refused.length > 0) {
  console.error(refused.slice(0, 200).join('\n'));
  if (refused.length > 200) console.error(`… and ${refused.length - 200} more`);
  console.error(`check-npm-pack: ${refused.length} refused`);
  process.exit(1);
}
console.log('check-npm-pack: every relative import of lib/ is in the tarball');
