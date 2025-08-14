# Jupyter UI - Comprehensive Repository Summary

## Project Overview

Jupyter UI is an open-source React.js component library that bridges the gap between the Jupyter ecosystem and modern web development frameworks. It provides React components that are 100% compatible with Jupyter, allowing developers to build custom data products without being constrained by the traditional JupyterLab interface.

### Core Problem Solved

Traditional JupyterLab uses the Lumino widget toolkit, an imperative UI framework that isn't compatible with modern declarative frameworks like React. This forces developers to either:

- Use iframes to embed Jupyter notebooks (limiting integration)
- Work within the rigid extension system of JupyterLab
- Build entirely from scratch

Jupyter UI solves this by wrapping Jupyter functionality in React components, enabling seamless integration into any React application.

## Repository Structure

### Monorepo Architecture

The project uses Lerna to manage a monorepo structure with the following organization:

```
jupyter-ui/
├── packages/           # Core library packages
│   ├── react/         # Main React component library
│   ├── lexical/       # Rich text editor integration
│   ├── docusaurus-plugin/  # Docusaurus integration
│   └── vscode/        # VS Code extension
├── examples/          # Framework integration examples
│   ├── vite/         # Vite example
│   ├── next-js/      # Next.js integration
│   ├── docusaurus/   # Docusaurus example
│   └── lexical/      # Lexical editor example
├── storybook/        # Component showcase
├── docs/            # Documentation site (Docusaurus)
├── dev/             # Development utilities
└── attic/           # Archived/experimental code
```

## Core Packages

### 1. @datalayer/jupyter-react (v1.0.7)

The main package providing React components for Jupyter functionality.

**Key Components:**

- **Notebook Components**: Full notebook interface with cells, outputs, toolbar
- **Cell Components**: Individual code/markdown cells with execution
- **Console**: Interactive Jupyter console
- **Terminal**: Web-based terminal interface
- **FileBrowser**: File system navigation
- **Kernel Management**: Kernel lifecycle and execution
- **Output Rendering**: Display of execution results, plots, widgets

**Architecture:**

- Uses JupyterLab's underlying services (kernels, sessions, contents)
- Provides React context providers for state management
- Supports both local and remote Jupyter servers
- Implements WebSocket communication for real-time updates

**Key Files:**

- `src/jupyter/JupyterContext.tsx` - Core context provider
- `src/components/notebook/Notebook.tsx` - Main notebook component
- `src/providers/ServiceManagerProvider.tsx` - Service management

### 2. @datalayer/jupyter-lexical (v1.0.3)

Integration with Meta's Lexical framework for rich text editing in notebooks.

**Features:**

- Rich text editing with Jupyter cell support
- Code highlighting and syntax support
- Equation rendering (KaTeX)
- Image and media embedding
- Collaborative editing capabilities
- Conversion between Lexical and nbformat

**Components:**

- Custom Lexical nodes for Jupyter cells
- Plugins for Jupyter-specific functionality
- Toolbar and formatting controls
- Output rendering within the editor

### 3. @datalayer/jupyter-docusaurus-plugin (v0.1.2)

Plugin enabling Jupyter notebook integration in Docusaurus documentation sites.

**Capabilities:**

- Embed live notebooks in documentation
- Interactive code execution
- Syntax highlighting
- Theme integration

### 4. datalayer-jupyter-vscode (v0.0.2)

VS Code extension for notebook editing using the Jupyter UI components.

**Features:**

- Custom notebook editor
- Kernel management within VS Code
- Runtime picker
- WebView-based rendering

## Development Infrastructure

### Build System

**Technologies:**

- TypeScript for type safety
- Webpack for bundling
- Gulp for resource management
- Babel for transpilation
- Lerna for monorepo management
- npm workspaces for dependency management

**Build Process:**

1. Resource copying via Gulp
2. TypeScript compilation
3. Webpack bundling
4. Package-specific builds

### Code Quality & Linting

**Pre-commit Hooks (Husky + lint-staged):**

- ESLint for code quality (v9 flat config)
- Prettier for code formatting
- TypeScript type checking
- Conventional commit messages (commitlint)

**Linting Stack:**

- ESLint with TypeScript support
- React and React Hooks plugins
- Prettier integration
- Custom rules for JupyterLab compatibility

**Available Scripts:**

- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check formatting
- `npm run type-check` - TypeScript type checking

### Development Server

**Jupyter Server Configuration:**

- Port: 8686
- Token authentication enabled
- CORS configured for development
- WebSocket support for kernels
- Terminal support enabled

**Frontend Development:**

- Hot module replacement
- Port: 3208 (varies by example)
- Proxy configuration for API calls

### Testing Infrastructure

### Storybook Testing

- **@storybook/test-runner** for automated story testing
- Custom MDX documentation testing with Playwright
- 38 component stories with smoke tests
- 13 MDX documentation files verified
- CI integration with GitHub Actions

### Test Commands

- `npm run test:storybook` - Test all stories
- `npm run test:mdx` - Test MDX documentation
- `npm run test:all` - Run both test suites

### Other Testing

- Jest for unit testing
- Playwright for UI testing
- Coverage reporting
- Python tests for server components

## Key Technologies & Dependencies

### Frontend Stack

- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **JupyterLab packages** - Core Jupyter functionality
- **Lumino** - Widget toolkit (underlying layer)
- **Primer** - GitHub's design system components
- **IPyWidgets** - Interactive widget support

### Styling & Theming

- CSS modules
- JupyterLab themes
- Tailwind CSS (v4 in lexical package)
- Custom theme providers

### Communication Layer

- WebSocket for kernel communication
- REST API for server operations
- Service Manager pattern
- Observable patterns for state

## Integration Patterns

### Basic Integration

```typescript
import { useJupyter, Notebook } from '@datalayer/jupyter-react';

function App() {
  const { defaultKernel, serviceManager } = useJupyter({
    jupyterServerUrl: "http://localhost:8686",
    jupyterServerToken: "your-token",
    startDefaultKernel: true,
  });

  return (
    <Notebook
      kernel={defaultKernel}
      serviceManager={serviceManager}
    />
  );
}
```

### Context Providers

The library uses nested context providers for state management:

1. **JupyterProvider** - Server connection and configuration
2. **ServiceManagerProvider** - Kernel and session management
3. **NotebookProvider** - Notebook-specific state
4. **ThemeProvider** - Visual theming

## State Management

### Zustand Store

The project uses Zustand for global state management with the following stores:

- **Kernel Store** - Kernel lifecycle and execution state
- **Notebook Store** - Notebook content and metadata
- **Cell Store** - Individual cell states
- **Output Store** - Execution outputs

### State Synchronization

- Real-time sync with Jupyter server
- Collaborative editing support
- Undo/redo functionality
- Dirty state tracking

## Extension Points

### Custom Renderers

Developers can register custom output renderers:

```typescript
registerRenderer({
  mimeType: 'application/custom',
  renderer: CustomComponent,
});
```

### Plugin System

The Lexical package supports plugins for:

- Custom cell types
- Toolbar extensions
- Keyboard shortcuts
- Output transformations

## Deployment Scenarios

### 1. Static Sites

- Build-time notebook rendering
- Client-side kernel execution (Pyodide)
- No server required

### 2. Server-Based

- Full Jupyter server backend
- Multi-user support
- Persistent storage
- Real-time collaboration

### 3. Hybrid

- Static content with on-demand execution
- Serverless function backends
- Edge computing scenarios

## Performance Optimizations

- Lazy loading of components
- Virtual scrolling for large notebooks
- Code splitting per feature
- Memoization of expensive operations
- WebWorker for heavy computations

## Security Considerations

- Token-based authentication
- CORS configuration
- XSS protection in output rendering
- Sandboxed iframe execution
- Content Security Policy support

## CI/CD Pipeline

### GitHub Actions Workflows

**build.yml:**

- Runs on main branch and PRs
- Build verification across packages
- Visual testing with Playwright
- Storybook story and MDX testing
- Docker container builds
- Uses npm instead of yarn
- TypeScript type checking
- ESLint error checking (no warnings)
- Prettier formatting validation

**Key Jobs:**

1. **build** - Compiles all packages
2. **visual-test** - Playwright visual regression tests
3. **storybook-test** - Tests all stories and documentation
4. **docker-dev** - Dev container verification

**Other Workflows:**

- `fix-license-header.yml` - Automatic license header corrections
- `publish-dev.yml` - Publishes dev versions to GitHub Packages

## Recent Improvements (2024-2025)

### Configuration Modernization

- **ESLint v9 Flat Config**: Migrated from deprecated .eslintignore to modern flat config format
- **Prettier JSON Config**: Replaced CommonJS config with .prettierrc.json
- **Line Endings**: Enforced LF line endings for cross-platform consistency
- **Trailing Commas**: Added support for better TypeScript compatibility
- **Node.js 20+**: Updated minimum requirement from Node 18 to Node 20
- **NVM Support**: Added .nvmrc file for consistent Node version management

### Code Quality Fixes

- **React 18 Migration**: Fixed deprecated ReactDOM.render usage
- **TypeScript Strictness**: Replaced @ts-ignore with @ts-expect-error
- **React Best Practices**: Added missing key props in list renderings
- **Security**: Added rel="noreferrer" to external links
- **Hook Rules**: Fixed conditional hook calls

### Storybook Fixes

- **MDX Comment Syntax**: Fixed malformed comments in 13 MDX files from `{/_` to `{/** **/}`
- **Prettier Exclusion**: Added MDX files to .prettierignore to prevent comment corruption
- **Missing Logo Files**: Created patch for @jupyterlite/javascript-kernel-extension to fix missing logo references

### Build & CI Improvements

- **Webpack Warnings**: Reduced source map warnings from 7 to 2 by excluding problematic packages
- **Patch-Package**: Added automatic patching of third-party modules during npm install
- **GitHub Actions**: Updated all workflows to use Node 20
- **Build Stability**: Fixed CI build failures in Storybook
- **Storybook CI Testing**: Fixed test runner connection issues with wait-on and explicit URL configuration
- **Terminal Component**: Fixed BoxPanel initialization error with proper direction setting and delayed widget addition

### Testing Infrastructure

- **Storybook Test Runner**: Automated testing for all component stories
- **MDX Documentation Testing**: Verification of documentation examples
- **CI Integration**: Full test suite runs on every PR

## Latest Session Updates (Aug 15, 2025)

### Storybook CI Test Fixes

- **Problem**: Test runner couldn't connect to Storybook static server (127.0.0.1 vs localhost mismatch)
- **Solution**:
  - Created `test:all:ci` script with explicit `--url http://localhost:6006`
  - Added `npx wait-on` to ensure server is ready before tests
  - Removed fixed sleep duration for more reliable CI runs

### Terminal Component Fixes

- **Problem**: `TypeError: Cannot read properties of null (reading 'addWidget')` in BoxPanel
- **Solution**:
  - Added `direction = 'top-to-bottom'` to BoxPanel initialization
  - Added defensive check in `setTheme` method
  - Implemented delayed widget addition with error handling
  - Added error logging for better debugging

### Files Modified in Latest Session

- `.github/workflows/build.yml` - Updated Storybook test runner configuration
- `storybook/package.json` - Added test:all:ci script
- `packages/react/src/components/terminal/TerminalAdapter.ts` - Fixed BoxPanel initialization

## Notable Features

### IPyWidgets Support

Full support for interactive widgets with two-way communication between Python and JavaScript.

### Collaborative Editing

Real-time collaboration using Y.js for conflict-free replicated data types.

### Multiple Kernel Support

Simultaneous connections to different kernels (Python, R, Julia, etc.).

### Extensible Output System

Support for various output types including:

- Plain text/HTML/Markdown
- Images (PNG, JPEG, SVG)
- Plots (Matplotlib, Plotly, Bokeh)
- DataFrames
- Interactive widgets

## Example Applications

The repository includes several example implementations:

1. **Vite Example** - Modern build tool integration
2. **Next.js Example** - Server-side rendering support
3. **Docusaurus Example** - Documentation site integration
4. **Lexical Example** - Rich text editing capabilities

## Community & Ecosystem

- Active development by Datalayer, Inc.
- MIT licensed
- Integration with major React frameworks
- Storybook for component documentation
- Comprehensive documentation site

## Future Roadmap (Based on Code Structure)

- JupyterLite support (browser-based kernels)
- PyScript integration
- Enhanced collaborative features
- More framework integrations
- Performance improvements
- Extended widget support

## Conclusion

Jupyter UI represents a significant advancement in making Jupyter notebooks accessible to modern web developers. By providing React components that wrap Jupyter functionality, it enables the creation of custom data products that leverage the full power of the Jupyter ecosystem while maintaining the flexibility and composability that React developers expect. The monorepo structure, comprehensive examples, and extensive documentation make it a robust solution for integrating computational notebooks into web applications.
