# Jupyter UI - AI Assistant Guide

## Quick Overview
React component library for building Jupyter-compatible applications. Monorepo with Lerna managing 4 main packages and multiple examples.

## Core Packages
- `@datalayer/jupyter-react` - Main React components for notebooks, cells, terminals
- `@datalayer/jupyter-lexical` - Rich text editor with Lexical framework integration  
- `@datalayer/jupyter-docusaurus-plugin` - Plugin for Docusaurus sites
- `datalayer-jupyter-vscode` - VS Code extension for notebooks

## Key Commands
```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start Jupyter server (required for development)
npm run jupyter:server

# Run specific examples
npm run jupyter:ui:vite       # Vite example
npm run jupyter:ui:nextjs     # Next.js example
npm run jupyter:ui:lexical    # Lexical editor example

# Run tests
npm test

# Lint and format
npm run lint

# Storybook
npm run storybook
```

## Development Setup
1. Requires Node.js >= 18.0.0
2. Uses port 8686 for Jupyter server, 3208 for frontend
3. Server token: `60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6`

## Architecture Notes
- Components wrap JupyterLab functionality in React declarative API
- Supports IPyWidgets, kernels, outputs, file browser
- Server communication via ServiceManager
- Uses Lumino widgets under the hood but exposes React interface

## Common Tasks
- Adding components: Create in `packages/react/src/components/`
- Testing examples: Use `examples/` folders with various frameworks
- Documentation: Update in `docs/` (Docusaurus site)
- Storybook: Components showcased in `storybook/`

## Important Files
- `lerna.json` - Monorepo configuration
- `dev/config/jupyter_server_config.py` - Server settings
- `packages/react/src/jupyter/JupyterContext.tsx` - Core context provider