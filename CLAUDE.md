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

## Extension Architecture

**Generic Provider Pattern**: `ICollaborationProvider = string | undefined` - accepts any provider name
- `CollaborationProviderRegistry` - Global registry validates providers at runtime  
- `JupyterCollaborationProvider` - Built-in for Jupyter Lab/Server collaboration
- Extensions auto-register providers on import

```typescript
// Built-in provider  
<Notebook collaborative="jupyter" ... />

// Extensions register custom providers automatically
import '@datalayer/core'; // Auto-registers 'datalayer' provider
<Notebook collaborative="datalayer" ... />
```

## Migration Status

**✅ Complete (v1.0.7)**: 100% generic, no Datalayer dependencies  
- Generic collaboration types (`ICollaborationProvider = string | undefined`)
- Extensible state management (`JupyterReactState`)  
- Plugin-based collaboration system
- Generic component naming (CodeMirrorEditor, NotebookExtension)
- One-way dependency: extensions → jupyter-ui (never reverse)

## Recent Updates (Session 2025-08-13)

- Fixed collaboration interface types (IJupyterCollaborationServer correctly has type: 'jupyter')
- Made ICollaborationProvider truly generic accepting any string provider name
- Created CollaborationProviderRegistry with runtime validation
- Added comprehensive generic examples in `src/examples/generic/`
- Renamed components to generic names (CodeMirrorEditor, NotebookExtension)