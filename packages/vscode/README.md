<a href="https://datalayer.io"><img src="https://assets.datalayer.tech/datalayer-25.png" width="150"/></a>

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# Jupyter Notebook for Visual Studio Code

This [Visual Studio Code](https://code.visualstudio.com) extension allows you to edit [Jupyter](https://jupyter.org) Notebooks files (`ipynb` extensions) with seamless integration to the [Datalayer](https://datalayer.io) platform. The extension is publicly available in the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=datalayer.datalayer-jupyter-vscode).

<img src="https://jupyter-examples.datalayer.tech/jupyter-react-vscode.gif" />

## 🎨 VS Code Theme Integration

The extension now features **complete VS Code theme integration** for a native development experience:

### Theme Features

- **🎯 Perfect Theme Matching**: Notebook cells automatically match your VS Code theme colors
- **🖌️ Syntax Highlighting**: CodeMirror editors use VS Code's exact syntax colors for all languages
- **🌓 Auto Theme Switching**: Seamlessly adapts when you change VS Code themes
- **📱 Native Toolbar**: VS Code-style toolbar with codicon icons for notebook operations
- **🎨 Background Harmony**: Eliminates visual gaps with proper background color inheritance
- **💾 Cell Backgrounds**: Code cells use VS Code's native notebook cell editor background

### Supported VS Code Themes

Works perfectly with all VS Code themes including:

- Dark+ (default dark)
- Light+ (default light)
- Monokai
- Solarized Dark/Light
- Dracula
- One Dark Pro
- Material Theme variants
- And all other VS Code themes!

## Working Features

- **Notebook Operations**: Load, display, and run Jupyter Notebooks with full kernel support
- **VS Code Theme Integration**: Perfect visual harmony with your VS Code environment
- **Lexical Editor**: Rich text editor with full formatting support for `.lexical` documents
- **Datalayer Authentication**: Token-based authentication with automatic GitHub profile enrichment
- **Server Connectivity**: Connect to Jupyter servers or Datalayer cloud platform
- **Real-time Execution**: Run code cells with live output and error display
- **IPyWidgets Support**: Full interactive widget support
- **Status Bar Integration**: View connection status and user profile
- **Spaces Tree View**: Browse and manage documents across all your Datalayer spaces
- **Runtime Management**: Automatic creation and reuse of Datalayer runtimes with configurable environments
- **Document Bridge**: Seamless document downloading and local caching for offline viewing
- **Virtual File System**: Clean virtual paths for Datalayer documents (e.g., `datalayer:/Space Name/document.lexical`)

## Notebook Toolbar

The extension provides a VS Code-native toolbar for notebook operations:

### Toolbar Actions

- **▶️ Run Cell**: Execute the currently selected cell
- **⏫ Run All Above**: Execute all cells above the current cell
- **⏬ Run All Below**: Execute all cells below the current cell
- **➕ Insert Cell**: Add new cells above or below
- **🗑️ Clear Outputs**: Clear all cell outputs
- **🔄 Restart Kernel**: Restart the Jupyter kernel
- **⏹️ Interrupt Kernel**: Stop executing cells

### Kernel Status Indicator

- **🟢 Green**: Kernel idle and ready
- **🟡 Yellow**: Kernel busy executing
- **🔴 Red**: Kernel disconnected or error

## Spaces Tree View

The extension provides a tree view in the Explorer sidebar that displays all your Datalayer spaces and documents:

### Features

- **Hierarchical Display**: Shows "Datalayer (@username)" as root, with spaces as folders containing documents
- **Document Types**: Displays notebooks with `.ipynb` extension and documents with `.lexical` extension
- **Default Space**: Marks your default space with "(Default)" label
- **Real-time Updates**: Refreshes when authentication state changes
- **Error Handling**: Shows helpful messages when not authenticated or when spaces are empty
- **Space Management**: Create new spaces directly from the tree view
- **Document Creation**: Create notebooks and lexical documents within any space
- **Item Management**: Rename and delete documents with API synchronization

### Tree Structure

```
Datalayer (@username) [+]
├── My Library (Default) [📓] [📄]
│   ├── notebook1.ipynb
│   ├── document1.lexical
│   └── notebook2.ipynb
├── Project Space [📓] [📄]
│   ├── analysis.ipynb
│   └── notes.lexical
└── Shared Space [📓] [📄]
    └── collaboration.ipynb
```

**Legend:**

- `[+]` - Create new space
- `[📓]` - Create new notebook
- `[📄]` - Create new lexical document

### Context Menu Actions

**For Documents:**

- **Open** - Open the document in the editor
- **Rename...** - Change the document name
- **Delete** - Remove the document from the space

**For Spaces:**

- **New Datalayer Notebook...** - Create a new notebook in the space
- **New Lexical Document...** - Create a new lexical document in the space

## Lexical Editor

The extension includes a rich text editor for `.lexical` documents with full formatting capabilities:

### Features

- **Rich Text Formatting**: Bold, italic, underline, strikethrough, and inline code
- **Headings**: H1, H2, H3 support with proper styling
- **Lists**: Bullet points and numbered lists
- **Text Alignment**: Left, center, right alignment options
- **Markdown Shortcuts**: Type markdown syntax for quick formatting
- **Undo/Redo**: Full history management
- **Read-only Mode**: Datalayer documents open in read-only mode for safe viewing
- **VS Code Theme Integration**: Seamlessly matches your VS Code theme

### Document Types

- **Local Files**: Create and edit `.lexical` files locally with full editing capabilities
- **Datalayer Documents**: View lexical documents from Datalayer spaces in read-only mode
- **Virtual Paths**: Datalayer documents show clean paths like `datalayer:/Space Name/document.lexical`

### Commands

- `Datalayer: Create new Datalayer Lexical Document` - Create a new lexical document in your workspace

### Usage

1. **Create New**: Use Command Palette → "Datalayer: Create new Datalayer Lexical Document"
2. **Open from Spaces**: Click any `.lexical` document in the Datalayer Spaces tree view
3. **Local Files**: Open any `.lexical` file from your workspace

## Authentication

The extension supports authentication with the Datalayer platform:

1. **Login**: Use Command Palette (`Cmd+Shift+P`) → "Datalayer: Login to Datalayer"
2. **Token Input**: Paste your Datalayer access token when prompted
3. **Auto-enrichment**: If authenticated via GitHub, your profile information is automatically fetched
4. **Status Display**: View connection status in the status bar with Datalayer icon

### Commands

- `Datalayer: Login to Datalayer` - Authenticate with your Datalayer token
- `Datalayer: Logout from Datalayer` - Sign out and clear stored credentials
- `Datalayer: Show Authentication Status` - View current authentication status
- `Datalayer: Create new Datalayer Notebook` - Create a new notebook file
- `Datalayer: Create new Datalayer Lexical Document` - Create a new lexical document
- `Datalayer: Refresh Spaces` - Refresh the spaces tree view
- `Datalayer: Open Document` - Open a document from the tree view (automatic on click)
- `Datalayer: New Datalayer Notebook...` - Create a new notebook in a selected space
- `Datalayer: New Lexical Document...` - Create a new lexical document in a selected space
- `Datalayer: Create New Space` - Create a new Datalayer space
- `Datalayer: Rename...` - Rename a notebook or lexical document
- `Datalayer: Delete` - Delete a notebook or lexical document

### Configuration

- `datalayer.serverUrl` - Datalayer server URL (default: https://prod1.datalayer.run)
- `datalayer.runtime.environment` - Default runtime environment for notebooks (`python-cpu-env` or `ai-env`, default: `python-cpu-env`)
- `datalayer.runtime.creditsLimit` - Default credits limit for new runtimes (minimum: 1, default: 10)

## Runtime Management

The extension automatically manages Datalayer runtimes for notebook execution:

- **Automatic Creation**: Runtimes are created on-demand when opening notebooks
- **Runtime Reuse**: Existing active runtimes are reused to conserve credits
- **Environment Selection**: Choose between `python-cpu-env` (standard scientific libraries) or `ai-env` (ML frameworks)
- **Credits Management**: Configure default credits limit for new runtimes
- **Health Verification**: Automatic verification of runtime availability before reuse

## CI/CD & Quality Assurance

The project includes comprehensive GitHub Actions workflows:

### Workflows

- **VSCode - Extension Build & Test**: Multi-platform build (Windows, macOS, Linux) with artifact generation
- **VSCode - Code Quality**: Automated linting and formatting checks
- **VSCode - Type Check**: TypeScript compilation and type safety verification

All workflows trigger only on changes to the VS Code extension package for efficient CI/CD.

## Not Implemented

- Save the Notebook.
- Notifying of updates to have a UI feedback the document is in dirty state.

## Known Limitations

- Websocket binary support: The extension currently forbids the usage of the newer protocol v1.kernel.websocket.jupyter.org due to serialization issues between the webview and extension.

## Documentation

The codebase is fully documented using TypeDoc. To generate documentation:

```bash
# Generate HTML documentation
npm run doc

# Generate markdown documentation
npm run doc:markdown

# Watch mode for development
npm run doc:watch
```

Documentation is generated in the `docs/` folder (HTML) or `docs-markdown/` folder (Markdown).

## Development

### Prerequisites

- Node.js >= 20.0.0
- VS Code >= 1.98.0
- npm (not yarn)

### Setup

```bash
# Install dependencies
npm install

# Watch for changes (development)
npm run watch

# Run linting
npm run lint

# Build extension
npm run compile

# Package extension
npm run package

# Create VSIX package
npm run vsix
```

### Testing

```bash
# Run tests
npm test

# Compile tests
npm run compile-tests

# Watch tests
npm run watch-tests
```

### Debugging

1. Open the project in VS Code
2. Run `npm run watch` in terminal
3. Press `F5` to launch Extension Development Host
4. Open any `.ipynb` file to test the extension

## License

MIT License - See [LICENSE](../../LICENSE) file for details.

## Support

For issues, feature requests, or questions, please visit our [GitHub repository](https://github.com/datalayer/jupyter-ui).
