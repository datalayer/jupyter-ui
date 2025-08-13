# CLAUDE.md

Jupyter React UI - React components and utilities for building Jupyter-based applications.

## Architecture

**IMPORTANT**: Dependency direction is `@datalayer/core` depends on `@datalayer/jupyter-react`. 
- Core imports from jupyter-ui (NOT the other way around)
- When migrating code, ensure jupyter-ui core is adapted so that it no longer depends on datalyer code.
- Backward compatibility does not need to be preserved when migrating things from `@datalayer/jupyter-react` to `@datalayer/core`

## Development Commands

**Build**: `npm run build`
**Test**: `npm run test`
**Storybook**: `npm run storybook`
**Docs**: `npm run build:docs`

## Key Components

- Jupyter components: Cell, Console, Notebook, Terminal, Viewer
- Service providers: ServiceManagerProvider, utility functions for creating ServiceManagers
- State management: Zustand stores for component state
- JupyterLab integration: Support for extensions and themes

## Migration Notes

When migrating functionality:
1. Core should import what it needs from jupyter-ui