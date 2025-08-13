# Generic Jupyter-UI Examples

This directory contains comprehensive examples demonstrating how to use all the generic features from `@datalayer/jupyter-react` without any Datalayer-specific dependencies.

## Overview

These examples showcase the fully generic architecture of jupyter-ui, demonstrating:
- Plugin-based collaboration system
- Extensible state management
- Generic notebook extensions
- Runtime provider validation

## Examples

### 1. GenericCollaborationExample.tsx
**Main comprehensive example** that demonstrates:
- Using generic `Notebook` and `CodeMirrorEditor` components
- Selecting between different collaboration providers
- Kernel management and execution
- State monitoring with `JupyterReactState`
- Interactive notebook features

```typescript
import { GenericCollaborationExample } from './GenericCollaborationExample';
// Shows complete Jupyter environment without Datalayer dependencies
```

### 2. CustomCollaborationProvider.ts
**Collaboration provider implementations** showing how to:
- Implement `ICollaborationProviderImpl` interface
- Create custom WebSocket-based collaboration
- Register providers with the global registry
- Support multiple provider types (custom, local, mock)

```typescript
import { CustomCollaborationProvider, registerCustomProviders } from './CustomCollaborationProvider';

// Register custom providers
registerCustomProviders();

// Use in components
<Notebook collaborative="custom-example" />
<Notebook collaborative="local-dev" />
<Notebook collaborative="mock" />
```

### 3. GenericNotebookExtensionExample.tsx
**Notebook extension patterns** demonstrating:
- Implementing the `NotebookExtension` interface
- Adding custom functionality to notebooks
- Extension lifecycle management
- Multiple extension types (custom, timing)

```typescript
import { GenericNotebookExtensionExample } from './GenericNotebookExtensionExample';

// Create custom extensions
class MyExtension implements NotebookExtension {
  init(props: INotebookExtensionProps): void { }
  createNew(panel, context): IDisposable { }
}

// Use with notebooks
<Notebook extensions={[new MyExtension()]} />
```

### 4. GenericStateManagementExample.tsx
**State management with JupyterReactState** showing:
- State subscriptions and selectors
- Real-time state updates
- Custom state extensions
- Interactive state modifications

```typescript
import { GenericStateManagementExample } from './GenericStateManagementExample';

// Subscribe to state changes
jupyterReactStore.subscribe(
  state => state.kernel,
  (kernel) => console.log('Kernel changed:', kernel)
);

// Update state
jupyterReactStore.setState({ kernel: myKernel });
```

## Running the Examples

### Prerequisites
```bash
# Install dependencies
npm install

# Build the package
npm run build
```

### Development Server
```bash
# Run Storybook to see examples
npm run storybook

# Or run development server
npm run dev
```

### Basic Usage
```typescript
import React from 'react';
import { Jupyter, Notebook, collaborationProviderRegistry } from '@datalayer/jupyter-react';

// Use built-in Jupyter collaboration
function MyApp() {
  return (
    <Jupyter 
      jupyterServerUrl="http://localhost:8888"
      jupyterServerToken="your-token"
    >
      <Notebook 
        path="example.ipynb"
        collaborative="jupyter"  // Built-in provider
      />
    </Jupyter>
  );
}

// Register and use custom provider
collaborationProviderRegistry.register('my-provider', new MyProvider());
<Notebook collaborative="my-provider" />
```

## Key Concepts

### Generic Collaboration System
The collaboration system accepts **any string** as a provider name:
```typescript
// Type definition - completely generic
export type ICollaborationProvider = string | undefined;

// Runtime validation
if (collaborationProviderRegistry.hasProvider(providerName)) {
  // Provider exists, use it
}
```

### Extensible State Management
JupyterReactState provides a generic Zustand store:
```typescript
// Access state
const state = jupyterReactStore.getState();

// Subscribe to changes
const unsubscribe = jupyterReactStore.subscribe(
  state => state.notebooks,
  (notebooks) => console.log('Notebooks changed')
);

// Update state
jupyterReactStore.setState({ cells: updatedCells });
```

### Plugin Architecture
Extensions can add functionality without modifying core:
```typescript
// Auto-registration pattern
import { collaborationProviderRegistry } from '@datalayer/jupyter-react';

// Providers register themselves on import
collaborationProviderRegistry.register('my-provider', new MyProvider());

// Components automatically have access
<Notebook collaborative="my-provider" />
```

## Advanced Patterns

### Creating a Custom Provider
```typescript
import { ICollaborationProviderImpl, ICollaborationOptions } from '@datalayer/jupyter-react';
import { WebsocketProvider as YWebsocketProvider } from 'y-websocket';

export class MyCustomProvider implements ICollaborationProviderImpl {
  readonly name = 'my-custom';
  
  async createProvider(options: ICollaborationOptions): Promise<YWebsocketProvider> {
    const { ydoc, awareness, path } = options;
    
    return new YWebsocketProvider(
      'ws://my-server:1234',
      `room-${path}`,
      ydoc,
      { awareness }
    );
  }
}
```

### Extending State
```typescript
// Create custom state selectors
const useKernelStatus = () => {
  const [status, setStatus] = useState('idle');
  
  useEffect(() => {
    return jupyterReactStore.subscribe(
      state => state.kernel?.connection?.status,
      setStatus
    );
  }, []);
  
  return status;
};
```

### Composing Extensions
```typescript
// Combine multiple extensions
const extensions = [
  new LoggingExtension(),
  new TimingExtension(),
  new CustomToolbarExtension()
];

<Notebook extensions={extensions} />
```

## API Reference

### Core Components
- `Notebook` - Main notebook component
- `CodeMirrorEditor` - Standalone code editor
- `Cell` - Individual notebook cell
- `Output` - Output display component

### State Management
- `jupyterReactStore` - Global Zustand store
- `useJupyter` - React hook for Jupyter context
- `JupyterReactState` - State type definition

### Collaboration
- `collaborationProviderRegistry` - Global provider registry
- `ICollaborationProvider` - Provider type (string | undefined)
- `ICollaborationProviderImpl` - Provider implementation interface

### Extensions
- `NotebookExtension` - Extension interface
- `INotebookExtensionProps` - Extension initialization props

## Notes

- All examples are **100% generic** with no Datalayer dependencies
- The collaboration system uses **runtime validation** instead of compile-time restrictions
- State management is **extensible** through composition
- Examples can be used as templates for your own implementations

## Support

For questions or issues:
- Check the main jupyter-ui documentation
- Review the CLAUDE.md files in the project
- See the migration guide in MIGRATION_JUPYTER_UI.md