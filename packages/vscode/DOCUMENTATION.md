# Documentation Guide

## Overview

This project uses TypeDoc for generating comprehensive API documentation with coverage reporting. TypeDoc automatically extracts documentation from TypeScript code and JSDoc comments.

## Tools

### TypeDoc with Coverage Plugin

We use `typedoc-plugin-coverage` to track documentation completeness. This provides:

- Coverage percentage metrics
- SVG badge generation
- JSON reports for CI integration
- Validation of missing documentation

### TypeDoc Version

- TypeDoc 0.26.x with TypeScript 5.x support

## Commands

```bash
# Generate HTML documentation with coverage
npm run doc

# Generate Markdown documentation
npm run doc:markdown

# Check documentation coverage only (validation mode)
npm run doc:coverage

# Watch mode for development
npm run doc:watch
```

## Coverage Reports

When you run `npm run doc`, the following files are generated:

- `docs/coverage.json` - Machine-readable coverage data
- `docs/coverage.svg` - Coverage badge for README files

## Configuration

Documentation settings are in `typedoc.json`:

- Coverage plugin enabled
- Validation for missing documentation
- All public APIs required to be documented

## CI/CD Integration

The GitHub Actions workflow automatically:

1. Checks documentation coverage on every push
2. Generates HTML and Markdown documentation
3. Creates coverage reports
4. Uploads documentation artifacts

## TypeDoc Supported Tags

### ✅ Supported Block Tags

- `@author` - Author information
- `@category` - Organize documentation into categories
- `@defaultValue` - Document default values
- `@deprecated` - Mark deprecated items
- `@example` - Code examples
- `@group` - Group related items
- `@license` - License information
- `@param` - Parameter documentation
- `@remarks` - Additional remarks
- `@returns` - Return value documentation
- `@see` - Cross-references
- `@since` - Version information
- `@summary` - Brief summary
- `@throws` - Exception documentation

### ✅ Supported Modifier Tags

- `@abstract` - Mark abstract members
- `@hidden` - Hide from documentation
- `@internal` - Mark internal APIs
- `@private` - Private members
- `@public` - Public members
- `@readonly` - Read-only properties

### ✅ Supported Inline Tags

- `{@inheritDoc}` - Inherit documentation
- `{@link}` - Link to other items
- `{@include}` - Include external content

### ❌ Unsupported Tags (Will Cause Warnings)

- `@class` - TypeDoc infers from TypeScript
- `@static` - TypeDoc infers from TypeScript
- `@async` - TypeDoc infers from TypeScript
- `@implements` - TypeDoc infers from TypeScript
- `@extends` - TypeDoc infers from TypeScript
- `@constructor` - TypeDoc infers from TypeScript
- `@export` - TypeDoc infers from TypeScript
- `@description` - Write description directly (no tag needed)
- `@namespace` - TypeDoc uses `@module` instead
- `@typedef` - Use TypeScript types instead

## Best Practices

1. **Function/Method Documentation**:

   ````typescript
   /**
    * Brief description of the function.
    * Additional details can go here.
    *
    * @param param1 Description of first parameter
    * @param param2 Description of second parameter
    * @returns Description of return value
    * @throws {Error} When something goes wrong
    * @example
    * ```typescript
    * const result = example('test', 42);
    * ```
    */
   export function example(param1: string, param2: number): string {
     // implementation
   }
   ````

2. **Module Documentation**:

   ```typescript
   /**
    * @module moduleName
    * Module description goes here directly.
    * Can span multiple lines.
    */
   ```

3. **Class/Interface Documentation**:

   ````typescript
   /**
    * Description of the class or interface.
    * TypeDoc automatically knows this is a class.
    *
    * @remarks
    * Additional implementation details
    *
    * @example
    * ```typescript
    * const instance = new Example();
    * ```
    */
   export class Example {
     /**
      * Property description
      */
     public property: string;
   }
   ````

4. **Property Documentation**:

   ```typescript
   interface Config {
     /** Host name for the server */
     host: string;
     /** Port number (default: 3000) */
     port?: number;
     /** Enable debug mode */
     debug?: boolean;
   }
   ```

5. **Enum Documentation**:
   ```typescript
   /**
    * Represents different states of the application
    */
   enum State {
     /** Initial state */
     Idle = 'idle',
     /** Processing state */
     Running = 'running',
     /** Error state */
     Error = 'error',
   }
   ```

## Current Status

### Coverage

✅ **100% Documentation Coverage** - All 466 items are fully documented with TypeDoc JSDoc comments!

### Metrics

- **Coverage Badge**: `docs/coverage.svg` ![100% Coverage](docs/coverage.svg)
- **Coverage Report**: `docs/coverage.json`
- **HTML Documentation**: `docs/index.html`
- **Warnings**: 10 warnings remaining (all internal class references)

### Key Achievements

- ✅ **100% documentation coverage achieved!**
- ✅ All public APIs fully documented
- ✅ All interfaces with property-level documentation
- ✅ All classes with constructor documentation
- ✅ Module-level documentation for all files
- ✅ Removed all unsupported JSDoc tags
- ✅ Fixed incorrect parameter documentation
- ✅ Comprehensive inline documentation for complex types
- ✅ Fixed FileSystemError references (removed 16 warnings)
- ✅ Added proper JSDoc overrides for FileSystemProvider methods
- ✅ Configured external symbol mappings for VS Code API types
- ✅ Reduced warnings from 100+ to just 10 intentional hidden class warnings
- ✅ Used `@hidden` tag for internal classes to exclude them from documentation

### Implementation Notes

1. TypeDoc automatically infers type information from TypeScript
2. Only use supported JSDoc tags (see list above)
3. Internal items can be hidden with `@internal` tag
4. React components document themselves through TypeScript props

### Remaining Warnings Explanation

The 10 remaining warnings are all intentional and expected:

- **Hidden Classes** (10 warnings): Classes and interfaces marked with `@hidden` tag are referenced but intentionally excluded from documentation
  - `LexicalDocument` - Hidden document type for lexical editor
  - `NotebookDocument` - Hidden document type for notebook editor
  - `NotebookToolbarProps` - Hidden React component props
  - `LexicalEditorProps` - Hidden React component props
  - `LexicalToolbarProps` - Hidden React component props
  - `VSCodeColors` - Hidden theme colors interface
  - `CodeMirrorThemeInjectorProps` - Hidden React component props
  - `IEnhancedJupyterReactThemeProps` - Hidden React component props
  - `ThemedLoaderProps` - Hidden React component props
  - `IColorMapping` - Hidden color mapping interface

These warnings don't affect the documentation quality or coverage. The hidden classes are implementation details not meant for public API documentation. Using `@hidden` instead of `@internal` ensures they are completely excluded from the documentation output.
