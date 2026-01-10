/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Post-compilation script to add .js extensions to relative imports/exports
 * This makes the compiled output compatible with Node.js 22 ES modules
 * while keeping the TypeScript source clean.
 */

const fs = require('fs');
const path = require('path');

const LIB_DIR = path.join(__dirname, '..', 'lib');

/**
 * Recursively get all .js files in a directory
 */
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Fix imports/exports in a JavaScript file
 */
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Get the directory containing this file for path resolution
  const fileDir = path.dirname(filePath);

  // Match import/export statements with relative paths that don't have extensions
  // Patterns to match:
  // - export * from './something'
  // - export { foo } from './something'
  // - import { foo } from './something'
  // - import './something'
  // - import type { foo } from './something'

  const patterns = [
    // export * as foo from './path' -> export * as foo from './path/index.js' or './path.js'
    /(\bexport\s+\*\s+as\s+\w+\s+from\s+['"])(\..+?)(['"])/g,
    // export * from './path' -> export * from './path.js'
    /(\bexport\s+\*\s+from\s+['"])(\..+?)(['"])/g,
    // export { ... } from './path' -> export { ... } from './path.js'
    /(\bexport\s+\{[^}]+\}\s+from\s+['"])(\..+?)(['"])/g,
    // import { ... } from './path' -> import { ... } from './path.js'
    /(\bimport\s+\{[^}]+\}\s+from\s+['"])(\..+?)(['"])/g,
    // import * as foo from './path' -> import * as foo from './path.js'
    /(\bimport\s+\*\s+as\s+\w+\s+from\s+['"])(\..+?)(['"])/g,
    // import foo from './path' -> import foo from './path.js'
    /(\bimport\s+\w+\s+from\s+['"])(\..+?)(['"])/g,
    // import './path' -> import './path.js'
    /(\bimport\s+['"])(\..+?)(['"])/g,
    // import type { ... } from './path' -> import type { ... } from './path.js'
    /(\bimport\s+type\s+\{[^}]+\}\s+from\s+['"])(\..+?)(['"])/g,
  ];

  patterns.forEach(pattern => {
    content = content.replace(pattern, (match, prefix, importPath, suffix) => {
      // Skip if already has extension
      if (importPath.match(/\.(js|ts|jsx|tsx|json|css)$/)) {
        return match;
      }

      // Skip if it has a query parameter (Vite special imports like ?raw, ?text, ?url, etc.)
      if (importPath.includes('?')) {
        return match;
      }

      // Skip if it's an asset import (images, svg, fonts, etc.)
      if (
        importPath.match(
          /\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot|ico|webp|avif|mp4|webm|ogg|mp3|wav|flac|aac|pdf|zip|tar|gz)$/,
        )
      ) {
        return match;
      }

      // Resolve the import path relative to this file
      const resolvedPath = path.join(fileDir, importPath);

      // Check if it's a directory (needs /index.js instead of .js)
      let extension = '.js';
      if (
        fs.existsSync(resolvedPath) &&
        fs.statSync(resolvedPath).isDirectory()
      ) {
        extension = '/index.js';
      }

      // Add appropriate extension
      modified = true;
      return `${prefix}${importPath}${extension}${suffix}`;
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main execution
console.log('🔧 Fixing ESM imports in compiled output...\n');

const jsFiles = getAllJsFiles(LIB_DIR);
let fixedCount = 0;

jsFiles.forEach(filePath => {
  const relativePath = path.relative(LIB_DIR, filePath);
  if (fixImportsInFile(filePath)) {
    console.log(`  ✅ Fixed: ${relativePath}`);
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} file(s) with missing .js extensions`);
console.log('   Output is now Node.js 22 ES modules compatible\n');
