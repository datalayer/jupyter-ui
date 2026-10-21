/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The relative module specifiers of a compiled ES module, as Node reads them.
 *
 * `tsc` with `moduleResolution: bundler` keeps a source's specifiers as they
 * are written (`'./approvals'`, `'./chat'`), which a bundler resolves and
 * Node's ESM loader refuses: it takes a relative specifier as a file path,
 * with no extension added and no directory's `index.js` looked up. So
 * `lib/` is made loadable by Node (a test runner's externalized dependencies,
 * a VS Code extension, a Node service) by writing each specifier whole
 * (`fully-specify-lib.mjs`), and the packed tarball is checked for a
 * specifier that names a file it does not carry (`check-npm-pack.mjs`).
 *
 * Comments are not read: TypeScript's own pre-processor lists the imports,
 * the exports and the dynamic imports of a file.
 */

import ts from 'typescript';
import { posix } from 'node:path';

/**
 * Every relative specifier of `text`, with the offset of its first
 * character in `text`.
 *
 * @param {string} text A compiled JavaScript module.
 * @returns {{ specifier: string, start: number }[]}
 */
export function relativeSpecifiers(text) {
  const { importedFiles } = ts.preProcessFile(text, true, true);
  const found = [];
  for (const { fileName, pos } of importedFiles) {
    if (!fileName.startsWith('./') && !fileName.startsWith('../')) continue;
    const start = text.indexOf(fileName, pos);
    if (start < 0) {
      throw new Error(`the specifier ${fileName} is not at ${pos}`);
    }
    found.push({ specifier: fileName, start });
  }
  return found;
}

/**
 * What a specifier of `from` names, given the files there are.
 *
 * @param {string} from The importing file, a posix path.
 * @param {string} specifier A relative specifier.
 * @param {(path: string) => boolean} isFile Whether a file is there.
 * @returns {{ status: 'whole' | 'partial' | 'missing', path?: string, whole?: string }}
 *   `whole`: the specifier names a file; `partial`: it names a file only
 *   once `.js` or `/index.js` is added (`whole` is the specifier written
 *   so); `missing`: no file.
 */
export function resolveSpecifier(from, specifier, isFile) {
  const query = specifier.search(/[?#]/);
  const bare = query < 0 ? specifier : specifier.slice(0, query);
  const target = posix.normalize(posix.join(posix.dirname(from), bare));
  if (isFile(target)) return { status: 'whole', path: target };
  if (query < 0) {
    if (isFile(`${target}.js`)) {
      return { status: 'partial', path: `${target}.js`, whole: `${bare}.js` };
    }
    const index = posix.join(target, 'index.js');
    if (isFile(index)) {
      return {
        status: 'partial',
        path: index,
        whole: `${bare.replace(/\/$/, '')}/index.js`,
      };
    }
  }
  return { status: 'missing' };
}
