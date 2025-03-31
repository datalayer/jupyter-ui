<a href="https://datalayer.io"><img src="https://assets.datalayer.tech/datalayer-25.png" width="150"/></a>

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# Jupyter Notebook for Visual Studio Code

This [Visual Studio Code](https://code.visualstudio.com) extension allows you to edit [Jupyter](https://jupyter.org) Notebooks files (`ipynb` extensions) and is publically available in the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=datalayer.datalayer-jupyter-vscode).

<img src="https://jupyter-examples.datalayer.tech/jupyter-react-vscode.gif" />

## Working Features

- Load a Notebook.
- Display a Notebook.
- Connect to a Jupyter Server by providing its URL with auth token; transfer http request and websocket messages.
- Run code.
- IPyWidgets support.

## Not Implemented

- Save the Notebook.
- Notifying of updates to have a UI feedback the document is in dirty state.

## Known Limitations

Styling
- No connection between dark/light vs code theme and notebook theme
- No resizing with the panel
- Button to select the runtime is not displayed in a toolbar that stays visible  - No connection between dark/light vs code theme and notebook theme
  - No resizing with the panel
  - Button to select the runtime is not displayed in a toolbar that stays visible


Websocket binary support: for now we forbid the usage of the newer protocol v1.kernel.websocket.jupyter.org. When using it, the message data are failing to be serialized to be transferred from the webview to the extension. And when receiving it, the deserialization fails. The deserialization error may be related to an incorrect binaryType that is not handle in the current code; but in JupyterLab it is forced to 'arraybuffer' for kernel websocket.
