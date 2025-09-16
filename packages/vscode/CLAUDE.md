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
- `datalayer.login`: Authenticate with Datalayer platform
- `datalayer.logout`: Sign out and clear credentials
- `datalayer.showAuthStatus`: View authentication status
- `datalayer.refreshSpaces`: Refresh the Spaces tree view
- `datalayer.openDocument`: Open a document from the Spaces tree
- `datalayer.createNotebookInSpace`: Create a new notebook in a selected space

## Configuration

- `datalayer.serverUrl`: Datalayer server URL (default: https://prod1.datalayer.run)

## Authentication Flow

1. User runs "Datalayer: Login to Datalayer" command
2. Extension prompts for Datalayer access token
3. Token is validated against Datalayer IAM API
4. If GitHub OAuth user, profile is enriched with GitHub data
5. JWT token and user data stored securely
6. Status bar updated with connection status
7. All notebook operations use authenticated connection

## Custom Editor

- View Type: `datalayer.jupyter-notebook`
- File Pattern: `*.ipynb`

## Spaces Tree View

The extension includes a tree view in the Explorer sidebar that displays:

- User's Datalayer spaces (with default space marked)
- Documents within each space:
  - Notebooks (`.ipynb` files)
  - Lexical documents (`.lexical` files)
  - Exercises and other document types
- Real-time sync with the Datalayer platform
- Context menu actions for creating new notebooks

### API Endpoints Used

- `/api/spacer/v1/spaces/users/me` - Get user's spaces
- `/api/spacer/v1/spaces/{id}/items` - Get items in a space
- `/api/spacer/v1/notebooks` - Create new notebooks

## Directory Structure

```
src/
├── auth/           # Authentication services
├── spaces/         # Spaces tree view implementation
├── test/           # Test files
├── extension.ts    # Main extension entry
└── notebookEditor.ts # Notebook editor provider

webview/           # React-based notebook UI
dist/              # Webpack build output
```
