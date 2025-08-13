# CLAUDE.md

Jupyter React UI - Generic React components and utilities for building Jupyter-based applications.

## Architecture

**IMPORTANT**: Dependency direction is `@datalayer/core` depends on `@datalayer/jupyter-react`. 
- Core imports from jupyter-ui (NOT the other way around)
- When migrating code, ensure jupyter-ui core is adapted so that it no longer depends on datalayer code.
- Backward compatibility does not need to be preserved when migrating things from `@datalayer/jupyter-react` to `@datalayer/core`
- **Jupyter-ui is completely generic** - no Datalayer-specific functionality should remain

## Development Commands

**Build**: `npm run build`
**Test**: `npm run test`
**Storybook**: `npm run storybook`
**Docs**: `npm run build:docs`

## Key Components

- **Jupyter components**: Cell, Console, Notebook, Terminal, Viewer (all generic)
- **Service providers**: ServiceManagerProvider, ServiceManagerLess (generic implementations)
- **State management**: JupyterReactState (generic Zustand store)
- **Collaboration system**: Extensible plugin-based collaboration with built-in Jupyter provider
- **JupyterLab integration**: Support for extensions and themes

## Collaboration System

**Plugin-based extensible architecture:**
- `CollaborationProviderRegistry` - Global registry for collaboration providers
- `ICollaborationProviderImpl` - Interface all providers must implement
- `JupyterCollaborationProvider` - Built-in provider for Jupyter Lab/Server collaboration
- Built-in providers auto-registered on import

**Usage:**
```typescript
// Use built-in Jupyter collaboration
<Notebook collaborative="jupyter" ... />

// Extensions can register custom providers
collaborationProviderRegistry.register('custom', new CustomProvider());
<Notebook collaborative="custom" ... />
```

## Migration Notes

**Completed Migration (v1.0.7):**
1. ✅ Removed all Datalayer-specific configuration from JupyterConfig
2. ✅ Made JupyterReactState completely generic (no datalayerConfig)
3. ✅ Moved DatalayerCollaboration to core package
4. ✅ Created extensible collaboration system with plugin pattern
5. ✅ Removed hardcoded collaboration logic from Notebook component

**Extension Points:**
- Core can extend JupyterReactState with DatalayerReactState
- Core can register additional collaboration providers
- Core can extend ServiceManagerLess with Datalayer-specific managers