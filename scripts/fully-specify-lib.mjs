#!/usr/bin/env node
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Writes each relative specifier of `lib/**\/*.js` whole, after `tsc`:
 * `'./approvals'` becomes `'./approvals.js'`, `'./chat'` (a folder)
 * `'./chat/index.js'`, so Node's ESM loader reads `lib/` as a bundler does.
 * A specifier that already names a file, or names none, is left as it is
 * (`check-npm-pack.mjs` refuses the second). Run again, it changes nothing.
 *
 * Usage: node scripts/fully-specify-lib.mjs [lib]
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { relativeSpecifiers, resolveSpecifier } from './esm-specifiers.mjs';

const root = resolve(process.argv[2] ?? 'lib');
const posixOf = path => relative(root, path).split(sep).join('/');

const files = [];
const walk = dir => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(posixOf(path));
  }
};
walk(root);
const present = new Set(files);
const isFile = path => present.has(path);

let rewritten = 0;
let changedFiles = 0;
for (const file of files.filter(name => name.endsWith('.js'))) {
  const path = join(root, file);
  const text = readFileSync(path, 'utf8');
  const edits = relativeSpecifiers(text)
    .map(({ specifier, start }) => ({
      specifier,
      start,
      ...resolveSpecifier(file, specifier, isFile),
    }))
    .filter(({ status }) => status === 'partial');
  if (edits.length === 0) continue;
  let out = text;
  for (const { specifier, start, whole } of edits.sort(
    (a, b) => b.start - a.start,
  )) {
    out = out.slice(0, start) + whole + out.slice(start + specifier.length);
  }
  writeFileSync(path, out);
  rewritten += edits.length;
  changedFiles += 1;
}
console.log(
  `fully-specify-lib: ${rewritten} specifiers written whole in ${changedFiles} of ${files.length} files under ${posixOf(root) || root}`,
);
