# Datalayer VS Code Extension - Claude Instructions

## Project Overview

This is a VS Code extension that provides a custom Jupyter Notebook editor with integrated Datalayer platform authentication and a Spaces tree view for managing cloud documents. It uses the `@datalayer/jupyter-react` component library and supports both local Jupyter servers and the Datalayer cloud platform.

## Architecture

- **Extension Code** (`src/`): Runs in VS Code's Node.js context, handles authentication and server communication
- **Webview Code** (`webview/`): Runs in an iframe, contains the React-based notebook editor
- **Authentication System** (`src/auth/`): Token-based authentication with GitHub profile enrichment
- **Spaces Tree View** (`src/spaces/`): Explorer sidebar for browsing Datalayer spaces and documents
- **Communication**: Message passing between extension and webview with JWT token injection

## Development Setup

1. Run `npm run watch` in terminal for auto-rebuild
2. Press `F5` to launch the extension in a new VS Code window
3. Open any `.ipynb` file to test the custom notebook editor
4. Use Command Palette → "Datalayer: Login to Datalayer" to authenticate

## Key Components

### Core Extension

- `src/extension.ts`: Main extension entry point with auth command registration
- `src/notebookEditor.ts`: Custom editor provider with authenticated connections

### Authentication System

- `src/auth/authService.ts`: Authentication service with secure token storage
- `src/auth/githubService.ts`: GitHub profile enrichment service
- `src/auth/tokenProvider.ts`: User interface for authentication flows

### Spaces Tree View

- `src/spaces/spacesTreeProvider.ts`: Tree data provider for Datalayer spaces
- `src/spaces/spacerApiService.ts`: API service for fetching spaces and documents
- `src/spaces/spaceItem.ts`: Data models for tree items

### Webview

- `webview/NotebookVSCode.tsx`: React component for the notebook UI
- `webview/serviceManager.ts`: Handles Jupyter service connections with JWT tokens

## Authentication Features

- **Token-based Login**: Secure authentication with Datalayer platform
- **GitHub Integration**: Automatic profile enrichment for GitHub OAuth users
- **Status Bar Integration**: Real-time connection status with Datalayer icon
- **Secure Storage**: JWT tokens stored using VS Code's SecretStorage API
- **Auto-reconnection**: Authenticated sessions persist across VS Code restarts

## Build & Package

- Development: `npm run watch`
- Production build: `npm run package`
- Create VSIX: `npm run vsix`
- Lint: `npm run lint`

## Testing

- Run tests: `npm test`
- Tests are located in `src/test/`
- Use Extension Test Runner in VS Code
- Test authentication in Extension Development Host

## Important Notes

- The editor runs in an iframe with message-based communication
- All HTTP requests and WebSocket connections include JWT authentication
- GitHub profile data is fetched and cached for enhanced user experience
- Uses webpack with two entry points (extension + webview)
- Published to VS Code Marketplace under "Datalayer" publisher

## Current Version

- Version: 0.0.2
- Publisher: Datalayer
- Requires VS Code: ^1.98.0

## Commands

- `datalayer.jupyter-notebook-new`: Create new Datalayer Notebook
- `datalayer.lexical-editor-new`: Create new Datalayer Lexical Document
- `datalayer.login`: Authenticate with Datalayer platform
- `datalayer.logout`: Sign out and clear credentials
- `datalayer.showAuthStatus`: View authentication status
- `datalayer.refreshSpaces`: Refresh the Spaces tree view
- `datalayer.openDocument`: Open a document from the Spaces tree
- `datalayer.createNotebookInSpace`: Create a new notebook in a selected space

## Configuration

- `datalayer.serverUrl`: Datalayer server URL (default: https://prod1.datalayer.run)
- `datalayer.runtime.environment`: Default runtime environment for notebooks (`python-cpu-env` or `ai-env`, default: `python-cpu-env`)
- `datalayer.runtime.creditsLimit`: Default credits limit for new runtimes (minimum: 1, default: 10)

## Authentication Flow

1. User runs "Datalayer: Login to Datalayer" command
2. Extension prompts for Datalayer access token
3. Token is validated against Datalayer IAM API
4. If GitHub OAuth user, profile is enriched with GitHub data
5. JWT token and user data stored securely
6. Status bar updated with connection status
7. All notebook operations use authenticated connection

## Custom Editors

### Jupyter Notebook Editor

- View Type: `datalayer.jupyter-notebook`
- File Pattern: `*.ipynb`

### Lexical Editor

- View Type: `datalayer.lexical-editor`
- File Pattern: `*.lexical`

## Spaces Tree View

The extension includes a tree view in the Explorer sidebar that displays:

- User's Datalayer spaces (with default space marked)
- Documents within each space:
  - Notebooks (`.ipynb` files)
  - Lexical documents (`.lexical` files)
  - Exercises and other document types
- Real-time sync with the Datalayer platform
- Context menu actions for creating new notebooks

## Lexical Editor Implementation

The extension includes a comprehensive rich text editor for `.lexical` documents built on the Lexical framework:

### Architecture

- **lexicalEditor.ts**: Custom editor provider that handles file operations and webview management
- **LexicalEditor.tsx**: Main React component with full rich text functionality
- **LexicalToolbar.tsx**: Formatting toolbar with VS Code theme integration
- **lexicalWebview.tsx**: Webview entry point that bridges VS Code and React components

### Key Features

- **Rich Text Editing**: Full support for bold, italic, underline, strikethrough, inline code
- **Structured Content**: Headings (H1, H2, H3), bullet lists, numbered lists
- **Text Alignment**: Left, center, right alignment options
- **Markdown Shortcuts**: Quick formatting using markdown syntax
- **History Management**: Undo/redo with proper state management
- **VS Code Integration**: Theme-aware styling and consistent UI

### Read-only Mode for Datalayer Documents

Lexical documents from Datalayer spaces open in read-only mode:

- **Virtual File System**: Uses `DatalayerFileSystemProvider` for clean virtual paths
- **Read-only Detection**: Automatically detects Datalayer documents via URI scheme (`datalayer:`)
- **Disabled Interactions**: Toolbar buttons disabled, no dirty state tracking
- **Visual Indicators**: Clear read-only banner and grayed-out controls

### Virtual File System

The extension uses a virtual file system for Datalayer documents:

- **Virtual URIs**: `datalayer:/Space Name/document.lexical` instead of temp paths
- **File System Provider**: Maps virtual URIs to real temp file locations
- **Clean User Experience**: Users see logical paths matching the tree structure
- **Transparent Operations**: All file operations work seamlessly through the virtual layer

### Editor Configuration

```json
{
  "namespace": "VSCodeLexicalEditor",
  "editable": true/false,
  "nodes": [
    "HeadingNode", "QuoteNode", "ListNode", "ListItemNode",
    "CodeNode", "CodeHighlightNode", "LinkNode", "AutoLinkNode"
  ]
}
```

### Save and Load Process

- **JSON Serialization**: Editor state saved as JSON for consistency
- **History Management**: Initial content load bypasses undo history
- **Dirty State**: Only tracked for editable local files
- **Auto-save Integration**: Hooks into VS Code's save system (Cmd/Ctrl+S)

## Runtime Management

The extension automatically manages Datalayer runtimes for notebook execution:

### Runtime Lifecycle

1. **Runtime Creation**: When opening a notebook, the extension checks for existing runtimes
2. **Runtime Reuse**: If an active runtime exists, it's reused to conserve credits
3. **Health Verification**: Runtime status is verified before reuse
4. **Configuration**: Uses settings for environment type and credits limit

### API Response Handling

The Spacer API returns wrapped responses with the following structure:

```json
{
  "success": true,
  "message": "Success message",
  "runtimes": [...] // or "kernel" for single runtime fetches
}
```

Important field mappings:

- Runtime URL: Use `ingress` field (not `jupyter_base_url`)
- Runtime token: Use `token` field (not `jupyter_token`)
- Single runtime responses: Check `kernel` field (not `runtime`)

### API Endpoints Used

- `/api/spacer/v1/spaces/users/me` - Get user's spaces
- `/api/spacer/v1/spaces/{id}/items` - Get items in a space
- `/api/spacer/v1/notebooks` - Create new notebooks
- `/api/ceres/v1/runtime/get` - Get list of user's runtimes
- `/api/ceres/v1/runtime/get/{pod_name}` - Get specific runtime details
- `/api/ceres/v1/runtime/create` - Create new runtime

## Directory Structure

```
src/
├── auth/                        # Authentication services
│   ├── authService.ts          # Token management and validation
│   ├── githubService.ts        # GitHub profile enrichment
│   └── tokenProvider.ts        # User authentication flows
├── spaces/                      # Spaces tree view implementation
│   ├── spacesTreeProvider.ts   # Tree data provider
│   ├── spacerApiService.ts     # Datalayer API client
│   ├── spaceItem.ts            # Data models
│   ├── documentBridge.ts       # Document download/cache manager
│   └── datalayerFileSystemProvider.ts # Virtual filesystem provider
├── test/                        # Test files
├── extension.ts                 # Main extension entry
├── notebookEditor.ts           # Notebook editor provider
└── lexicalEditor.ts            # Lexical editor provider

webview/                         # React-based UI components
├── NotebookVSCode.tsx          # Main notebook component
├── LexicalEditor.tsx           # Lexical rich text editor
├── LexicalToolbar.tsx          # Formatting toolbar for lexical editor
├── lexicalWebview.tsx          # Lexical editor webview entry point
├── serviceManager.ts           # Jupyter service connections
├── messageHandler.ts           # Extension-webview communication
└── utils.ts                    # Utility functions

dist/                           # Webpack build output
docs/                           # Generated HTML documentation (gitignored)
docs-markdown/                  # Generated markdown documentation (gitignored)
```

## Documentation

The codebase is fully documented using TypeDoc with JSDoc comments:

```bash
# Generate HTML documentation
npm run doc

# Generate markdown documentation
npm run doc:markdown

# Watch mode for development
npm run doc:watch
```

All TypeScript files include:

- Module-level JSDoc comments with `@module` and `@description` tags
- Method documentation with parameter and return descriptions
- Type definitions with clear descriptions
- Example usage where appropriate

## Code Quality

Run checks before committing:

```bash
npm run lint        # Run ESLint
npm run compile     # Build with webpack
```

## Important Development Guidelines

- **NO EMOJIS**: NEVER use emojis anywhere in the codebase - not in code, not in logging, not in testing, not in comments, not in documentation. This is a professional codebase.
- **API Field Names**: Always use the actual API field names (e.g., `ingress` not `jupyter_base_url`)
- **Error Handling**: Log errors with context for debugging, handle API wrapper responses
- **Runtime Reuse**: Always check for existing runtimes before creating new ones
- **Documentation**: Maintain JSDoc comments for all exported functions and classes
