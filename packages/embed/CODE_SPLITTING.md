# Code Splitting Strategy for @datalayer/jupyter-embed

## Problem

The current single-bundle approach produces a **~13MB** JavaScript file (3.4MB gzipped), which is too large for most use cases. Users who only need a simple code cell shouldn't have to download the entire JupyterLab ecosystem.

## Strategy Overview

We propose a **multi-phase approach** from simple to complex:

### Phase 1: ES Module Build with Automatic Code Splitting (Recommended First Step)

Use Vite's native ES module output with automatic vendor chunking. This requires no architecture changes - just a config update.

**Output structure:**

```
dist-esm/
├── jupyter-embed.js      # Main entry (~50KB, imports chunks)
├── chunks/
│   ├── vendor-react-xxx.js     # React/ReactDOM (~140KB)
│   ├── vendor-jupyterlab-xxx.js # JupyterLab core (~2MB)
│   ├── vendor-codemirror-xxx.js # CodeMirror (~800KB)
│   ├── vendor-xterm-xxx.js     # xterm (~400KB)
│   └── vendor-mathjax-xxx.js   # MathJax (~500KB)
└── assets/
```

**Usage:**

```html
<!-- ES Module version - browsers load only needed chunks -->
<script type="module" src="https://cdn/jupyter-embed.js"></script>
```

**Benefits:**

- No code changes required
- Browser handles chunk loading automatically
- Chunks are cached independently
- Tree-shaking works properly

### Phase 2: Bootstrap Loader with Dynamic Imports

A lightweight bootstrap script that detects which components are needed and loads only those.

**Files:**

- `src/bootstrap.ts` - Minimal loader (~50KB)
- `src/chunks/*.tsx` - Component-specific chunks

**Build output:**

```
dist-chunked/
├── jupyter-embed.js      # Bootstrap loader (~50KB)
├── chunks/
│   ├── core.js           # Shared dependencies
│   ├── cell.js           # Cell component only
│   ├── output.js         # Output component only
│   ├── notebook.js       # Full notebook
│   ├── terminal.js       # Terminal only
│   └── viewer.js         # Read-only viewer
└── shared/
    ├── vendor-react-xxx.js
    └── vendor-jupyterlab-xxx.js
```

### Phase 3: Component-Level Code Splitting in jupyter-react

The most effective long-term solution is to implement lazy loading at the source - in `@datalayer/jupyter-react`:

```typescript
// Instead of:
import { Cell, Notebook, Terminal } from '@datalayer/jupyter-react';

// Use dynamic imports:
const Cell = lazy(() => import('@datalayer/jupyter-react/cell'));
const Notebook = lazy(() => import('@datalayer/jupyter-react/notebook'));
const Terminal = lazy(() => import('@datalayer/jupyter-react/terminal'));
```

This requires changes to `packages/react` with separate entry points.

## Immediate Action: Phase 1 Implementation

Update `vite.config.ts` to produce ES modules with vendor chunking:

```typescript
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'], // ES modules only
      fileName: () => 'jupyter-embed.js',
    },
    rollupOptions: {
      output: {
        // Automatic code splitting
        manualChunks: id => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@jupyterlab')) return 'vendor-jupyterlab';
            if (id.includes('@codemirror')) return 'vendor-codemirror';
            if (id.includes('@xterm')) return 'vendor-xterm';
            if (id.includes('mathjax')) return 'vendor-mathjax';
          }
        },
      },
    },
  },
});
```

## Expected Results

### Phase 1 Build Output (Actual)

| Chunk                    | Size  | Gzipped | Description              |
| ------------------------ | ----- | ------- | ------------------------ |
| jupyter-embed.esm.js     | 5.4MB | 1.9MB   | Main entry + shared code |
| vendor-codemirror        | 1.7MB | 579KB   | CodeMirror editor        |
| vendor-jupyter-core      | 1.2MB | 300KB   | JupyterLab core          |
| vendor-mathjax           | 864KB | 203KB   | Math rendering           |
| vendor-react             | 822KB | 177KB   | React/ReactDOM           |
| vendor-xterm             | 489KB | 119KB   | Terminal emulator        |
| vendor-lumino            | 200KB | 49KB    | Lumino widgets           |
| vendor-jupyter-renderers | 157KB | 43KB    | Output renderers         |
| vendor-jupyter-notebook  | 143KB | 35KB    | Notebook components      |
| vendor-jupyter-services  | 104KB | 23KB    | Jupyter server API       |
| **Total**                | ~11MB | ~3.5MB  | All chunks combined      |

### Comparison

| Build Type     | Total Size | Gzipped | Notes                           |
| -------------- | ---------- | ------- | ------------------------------- |
| IIFE (current) | 13MB       | 3.4MB   | Single file, no caching benefit |
| ESM (Phase 1)  | 11MB       | 3.5MB   | Chunks cached independently     |

**Key Benefit**: While total size is similar, ESM allows browsers to:

- Cache vendor chunks separately (they rarely change)
- Load chunks in parallel
- Skip downloading cached chunks on repeat visits

### Future Optimization (Phase 3)

To significantly reduce initial load, the `@datalayer/jupyter-react` package needs to be refactored with:

- Separate entry points per component
- Dynamic imports for heavy dependencies
- Tree-shaking friendly exports

This would enable load scenarios like:

- **Output only**: ~2MB (skip codemirror, notebook, terminal)
- **Cell only**: ~3MB (skip notebook, terminal)
- **Terminal only**: ~2MB (skip notebook, codemirror)

## Browser Support

- **Phase 1 (ES Modules)**: Chrome 61+, Firefox 60+, Safari 11+, Edge 79+
- **IIFE fallback**: All browsers (but no code splitting)

## CDN Deployment

For ES modules to work from CDN, ensure:

1. Correct MIME type: `application/javascript`
2. CORS headers for cross-origin modules
3. Immutable cache headers for chunked files

## Next Steps

1. ✅ Create `vite.esm.config.ts` for ES module build with vendor chunking
2. ✅ Create `src/bootstrap.ts` for dynamic loading
3. ✅ Create `src/chunks/*.tsx` component chunks
4. ✅ Test ES module build - working with vendor chunks
5. ✅ Refactor `@datalayer/jupyter-react` with separate entry points
6. ✅ Add `exports` field to jupyter-react `package.json` for tree-shaking
7. ⏳ Update embed package to use separate imports
8. ⏳ Fix TypeScript errors in chunk files (for Phase 2)
9. ⏳ Update deployment to serve both IIFE and ESM versions
10. ⏳ Document usage for ESM version

## Phase 3: jupyter-react Refactoring (In Progress)

The `@datalayer/jupyter-react` package now has separate entry points:

```typescript
// New entry points available:
import { Cell } from '@datalayer/jupyter-react/cell';
import { Notebook } from '@datalayer/jupyter-react/notebook';
import { Output } from '@datalayer/jupyter-react/output';
import { Terminal } from '@datalayer/jupyter-react/terminal';
import { Console } from '@datalayer/jupyter-react/console';
import { Viewer } from '@datalayer/jupyter-react/viewer';
import { Jupyter } from '@datalayer/jupyter-react/jupyter';
import { Theme } from '@datalayer/jupyter-react/theme';

// Or the traditional import (still works for backwards compatibility):
import {
  Cell,
  Notebook,
  Output,
  Terminal,
  Console,
  Viewer,
} from '@datalayer/jupyter-react';
```

These entry points are defined in `packages/react/package.json` exports field, enabling bundlers to tree-shake unused components.
