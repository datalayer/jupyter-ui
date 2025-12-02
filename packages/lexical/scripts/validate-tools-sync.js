#!/usr/bin/env node
/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Validation script to ensure tool definitions and operations stay in sync.
 *
 * Checks:
 * 1. Every definition has a corresponding operation
 * 2. Every operation has a corresponding definition
 * 3. Tool names match between definition and operation
 * 4. No orphaned files
 *
 * Usage: npm run validate:tools
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = path.join(__dirname, '../src/tools');
const DEFINITIONS_DIR = path.join(TOOLS_DIR, 'definitions');
const OPERATIONS_DIR = path.join(TOOLS_DIR, 'operations');

function getToolFiles(dir) {
  const files = fs.readdirSync(dir);
  return files
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => ({
      name: f.replace('.ts', ''),
      path: path.join(dir, f),
    }));
}

function extractToolName(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // For definitions: export const xxxTool
  const defMatch = content.match(/export const (\w+)Tool:/);
  if (defMatch) {
    return defMatch[1]; // e.g., "insertBlock" from "insertBlockTool"
  }

  // For operations: export const xxxOperation
  const opMatch = content.match(/export const (\w+)Operation:/);
  if (opMatch) {
    return opMatch[1]; // e.g., "insertBlock" from "insertBlockOperation"
  }

  return null;
}

function main() {
  console.log(
    '🔍 Validating lexical tool definitions and operations sync...\n',
  );

  const definitions = getToolFiles(DEFINITIONS_DIR);
  const operations = getToolFiles(OPERATIONS_DIR);

  console.log(`Found ${definitions.length} definitions:`);
  definitions.forEach(d => console.log(`  - ${d.name}`));
  console.log();

  console.log(`Found ${operations.length} operations:`);
  operations.forEach(o => console.log(`  - ${o.name}`));
  console.log();

  let hasErrors = false;

  // Check 1: File name alignment
  const defNames = new Set(definitions.map(d => d.name));
  const opNames = new Set(operations.map(o => o.name));

  // Find definitions without operations
  const missingOps = definitions.filter(d => !opNames.has(d.name));
  if (missingOps.length > 0) {
    console.error('❌ Definitions without matching operations:');
    missingOps.forEach(d => console.error(`   ${d.name}`));
    hasErrors = true;
  }

  // Find operations without definitions
  const missingDefs = operations.filter(o => !defNames.has(o.name));
  if (missingDefs.length > 0) {
    console.error('❌ Operations without matching definitions:');
    missingDefs.forEach(o => console.error(`   ${o.name}`));
    hasErrors = true;
  }

  // Check 2: Tool name extraction from file content
  console.log('\n📝 Checking exported names...');
  for (const def of definitions) {
    const toolName = extractToolName(def.path);
    if (!toolName) {
      console.error(`❌ Could not extract tool name from ${def.name}`);
      hasErrors = true;
    } else if (toolName !== def.name) {
      console.error(
        `❌ File name mismatch: ${def.name}.ts exports ${toolName}Tool`,
      );
      hasErrors = true;
    }
  }

  for (const op of operations) {
    const toolName = extractToolName(op.path);
    if (!toolName) {
      console.error(`❌ Could not extract tool name from ${op.name}`);
      hasErrors = true;
    } else if (toolName !== op.name) {
      console.error(
        `❌ File name mismatch: ${op.name}.ts exports ${toolName}Operation`,
      );
      hasErrors = true;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.error('❌ Validation FAILED - lexical tools are out of sync!');
    process.exit(1);
  } else {
    console.log('✅ Validation PASSED - all lexical tools are in sync!');
    console.log(`\n   ${definitions.length} definition(s)`);
    console.log(`   ${operations.length} operation(s)`);
    console.log('   Perfect 1:1 alignment! 🎉');
  }
}

main();
