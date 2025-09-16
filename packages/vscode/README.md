<a href="https://datalayer.io"><img src="https://assets.datalayer.tech/datalayer-25.png" width="150"/></a>

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# Jupyter Notebook for Visual Studio Code

This [Visual Studio Code](https://code.visualstudio.com) extension allows you to edit [Jupyter](https://jupyter.org) Notebooks files (`ipynb` extensions) with seamless integration to the [Datalayer](https://datalayer.io) platform. The extension is publicly available in the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=datalayer.datalayer-jupyter-vscode).

<img src="https://jupyter-examples.datalayer.tech/jupyter-react-vscode.gif" />

## Working Features

- **Notebook Operations**: Load, display, and run Jupyter Notebooks
- **Datalayer Authentication**: Token-based authentication with automatic GitHub profile enrichment
- **Server Connectivity**: Connect to Jupyter servers or Datalayer cloud platform
- **Real-time Execution**: Run code cells with live output and error display
- **IPyWidgets Support**: Full interactive widget support
- **Status Bar Integration**: View connection status and user profile

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

### Configuration

- `datalayer.serverUrl` - Datalayer server URL (default: https://prod1.datalayer.run)

## Not Implemented

- Save the Notebook.
- Notifying of updates to have a UI feedback the document is in dirty state.

## Known Limitations

Styling

- No connection between dark/light vs code theme and notebook theme
- No resizing with the panel
- Button to select the runtime is not displayed in a toolbar that stays visible - No connection between dark/light vs code theme and notebook theme
  - No resizing with the panel
  - Button to select the runtime is not displayed in a toolbar that stays visible

Websocket binary support: for now we forbid the usage of the newer protocol v1.kernel.websocket.jupyter.org. When using it, the message data are failing to be serialized to be transferred from the webview to the extension. And when receiving it, the deserialization fails. The deserialization error may be related to an incorrect binaryType that is not handle in the current code; but in JupyterLab it is forced to 'arraybuffer' for kernel websocket.
