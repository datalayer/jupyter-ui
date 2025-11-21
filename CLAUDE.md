# Jupyter UI - Quick Reference

## Overview

React component library for Jupyter notebooks. Monorepo with 4 main packages.

## Commands

```bash
# Setup
npm install
npm run build

# Development
npm run jupyter:server       # Start Jupyter (port 8686)
npm run storybook           # Start Storybook (port 6006)

# React package dev (cd packages/react)
npm run start               # Remote server config
npm run start-local         # Local server (webpack + jupyter)
npm run start-local:webpack # Only webpack

# Code quality
npm run check               # Format, lint, type-check
npm run check:fix          # Auto-fix and check
```

## Key Info

- **Node.js**: >= 20.0.0 (use .nvmrc)
- **Server token**: `60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6`
- **Webpack entry**: Edit `packages/react/webpack.config.js` → `ENTRY` variable
- **Jupyter config**: `dev/config/jupyter_server_config.py`

## Collaboration Setup

1. Install: `pip install jupyter-collaboration jupyterlab`
2. Enable: Set `c.LabApp.collaborative = True` in jupyter config
3. Test: Open http://localhost:3208/ in multiple windows

## Collaboration Providers

```tsx
// Basic usage
const provider = new JupyterCollaborationProvider();
<Notebook collaborationProvider={provider} path="notebook.ipynb" />;

// With config
const provider = new JupyterCollaborationProvider({
  path: 'notebook.ipynb',
  serverSettings: mySettings,
});
```

## Troubleshooting

- **Build fails**: Run `npm run type-check`
- **Lint errors**: Run `npm run lint:fix`
- **Node version**: Use Node 20+ (`nvm use`)
- **Collaboration issues**: Check WebSocket connections and jupyter-collaboration installation

## Development Tips

- Use npm, not yarn
- Prefer editing over creating files
- Run checks after changes: `npm run check:fix`

## Critical: Package Loading Side Effects (November 2024)

### Problem: Lumino Widget Initialization Crash

**Background:**
The `@datalayer/jupyter-lexical` package includes Jupyter output nodes (`JupyterOutputNode`, `JupyterCellNode`) that create Lumino widgets during module initialization. When this package is imported, it immediately initializes these widgets.

**Issue:**
If lexical is imported in contexts where it's not needed (e.g., notebook-only tools), the Lumino widget initialization runs prematurely and crashes with:

```text
Cannot set properties of undefined (setting 'class-name')
```

**Root Cause:**

- `packages/lexical/src/index.ts` exports `./plugins` and `./nodes`
- These modules create Lumino `OutputArea` widgets on load
- If DOM isn't ready or initialization order is wrong → crash

### Solution: Lazy Loading Pattern

**DO:**

- Import lexical **only when actually needed** for lexical editing
- Separate imports by use case (notebook vs lexical)
- Use dynamic imports for optional features

**DON'T:**

- Import lexical in notebook-only code
- Create combined adapters that import both `@datalayer/jupyter-react` and `@datalayer/jupyter-lexical`
- Mix package imports unless both are actively needed

### Example: ag-ui Adapter Fix

The `@datalayer/core` package had a combined hooks file that imported both packages:

```typescript
// ❌ BAD - Causes crash when only notebook tools are needed
import { ... } from '@datalayer/jupyter-lexical';
import { ... } from '@datalayer/jupyter-react';
```

**Fixed by splitting into separate files:**

```typescript
// ✅ GOOD - notebookHooks.tsx (notebook only)
import { ... } from '@datalayer/jupyter-react';

// ✅ GOOD - lexicalHooks.tsx (lexical only)
import { ... } from '@datalayer/jupyter-lexical';
```

This ensures lexical code only loads when lexical editing is actually used.

### Testing After Changes

If you modify lexical or react packages, test that:

1. **Notebook-only code** doesn't trigger lexical loading
2. **Lexical code** loads correctly when needed
3. **No crashes** during module initialization
4. **Bundle size** doesn't include unused packages

Check consuming packages (like `@datalayer/core`) to ensure they use proper separation patterns.
