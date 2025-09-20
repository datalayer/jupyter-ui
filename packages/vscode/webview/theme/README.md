# Enhanced Theme System for VS Code Extension

This folder contains an extensible theme system that supports multiple theme providers (VS Code, JupyterLab, custom themes) while maintaining compatibility with the existing `@datalayer/jupyter-react` package.

## Architecture

### Core Components

1. **Theme Providers** (`providers/`)
   - `BaseThemeProvider`: Abstract base class for all theme providers
   - `VSCodeThemeProvider`: Extracts and maps VS Code theme colors
   - Future: `JupyterLabThemeProvider`, `CustomThemeProvider`

2. **Color Mapping** (`mapping/`)
   - `UniversalColorMapper`: Maps semantic colors between different theme systems
   - Provides unified color abstraction layer

3. **Components** (`components/`)
   - `EnhancedJupyterReactTheme`: Enhanced theme wrapper component
   - Supports auto-detection of environment

4. **Types** (`types/`)
   - Comprehensive TypeScript definitions
   - Support for extended color modes (including high-contrast)

## Features

- **Auto-detection**: Automatically detects VS Code or JupyterLab environment
- **VS Code Integration**: Extracts VS Code theme colors from CSS variables
- **Dynamic Updates**: Responds to theme changes in real-time
- **CSS Variable Injection**: Injects theme variables for consistent styling
- **Primer Compatibility**: Maps themes to Primer React structure
- **Extensible**: Easy to add new theme providers

## Usage

### Basic Usage with VS Code Theme

```tsx
import { EnhancedJupyterReactTheme } from './theme';

function App() {
  return (
    <EnhancedJupyterReactTheme provider="vscode">
      <Notebook />
    </EnhancedJupyterReactTheme>
  );
}
```

### Auto-detect Environment

```tsx
<EnhancedJupyterReactTheme provider="auto">
  <Notebook />
</EnhancedJupyterReactTheme>
```

### Custom Theme Provider

```tsx
import { BaseThemeProvider } from './theme';

class MyCustomProvider extends BaseThemeProvider {
  // Implementation...
}

const provider = new MyCustomProvider();

<EnhancedJupyterReactTheme customProvider={provider}>
  <Notebook />
</EnhancedJupyterReactTheme>;
```

### Access Theme in Components

```tsx
import { useTheme } from './theme';

function MyComponent() {
  const { theme, colorMode, provider } = useTheme();

  return (
    <div>
      Current theme: {theme?.name}
      Color mode: {colorMode}
    </div>
  );
}
```

## How It Works

### VS Code Theme Detection

The `VSCodeThemeProvider`:

1. Scans for VS Code CSS variables (e.g., `--vscode-editor-background`)
2. Extracts color values from computed styles
3. Maps VS Code colors to semantic colors
4. Provides Primer-compatible theme object
5. Monitors for theme changes via MutationObserver

### Color Mapping

The `UniversalColorMapper` provides mappings between:

- Semantic names (e.g., `background.primary`)
- JupyterLab variables (e.g., `--jp-layout-color0`)
- VS Code variables (e.g., `--vscode-editor-background`)
- Primer tokens (e.g., `canvas.default`)

### CSS Variable Injection

The system can inject CSS variables at the root level:

```css
:root {
  --theme-background-primary: var(--vscode-editor-background);
  --theme-text-primary: var(--vscode-editor-foreground);
  /* ... more variables */
}
```

## Benefits

1. **Unified Experience**: Notebook matches VS Code's theme automatically
2. **Future-proof**: Easy to add support for more editors/themes
3. **Type-safe**: Full TypeScript support with IntelliSense
4. **Performance**: Lazy loading and efficient change detection
5. **Backward Compatible**: Works alongside existing theme system

## Migration Path

This theme system is designed to be eventually merged into `@datalayer/jupyter-react`:

1. **Phase 1** (Current): Proof of concept in VS Code extension
2. **Phase 2**: Refine based on testing and feedback
3. **Phase 3**: Propose as enhancement to jupyter-react
4. **Phase 4**: Migrate to jupyter-react package
5. **Phase 5**: Update all consumers to use new system

## Testing

To test the VS Code theme integration:

1. Edit `NotebookVSCode.tsx`
2. Uncomment the `EnhancedJupyterReactTheme` usage
3. Comment out the standard `JupyterReactTheme`
4. Run the extension
5. Switch VS Code themes and observe the notebook updating

## Future Enhancements

- [ ] JupyterLab theme provider
- [ ] Theme persistence/preferences
- [ ] Custom theme builder UI
- [ ] Theme export/import
- [ ] High contrast mode support
- [ ] Theme preview component
- [ ] Performance optimizations
- [ ] More comprehensive color mappings
