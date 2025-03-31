# Welcome to Datalayer VS Code Extension

## What's in the folder

- `package.json` - this is the manifest file in which you declare your extension and entry points.
- `src` - this is the extension code living within VS Code _core_.
- `src/extension.ts` - this is the main file where you will provide the implementation of your extension.
  - The file exports one function, `activate`, which is called the very first time your extension is activated.
    Inside the `activate` function we call `NotebookEditorProvider.register` to add our custom editor provider.
- `webview` - this is the webview code for the editor living in an iframe.
- `webview/main.ts` - this is the main file for the webview.

## Setup

Install the recommended extensions: `amodio.tsl-problem-matcher`, `ms-vscode.extension-test-runner` and `dbaeumer.vscode-eslint`.

## Get up and running straight away

Press `F5` to open a new VS Code with your extension loaded and pen a notebook (extension `.ipynb`) file.

Set breakpoints in your code inside `src/*` to debug your extension.

Find output from your extension in the devtools debug console (CTRL-SHIFT-I).

## Make changes

- You can relaunch the extension from the debug toolbar after changing code in `src/*`.
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

> [!TIP]
>
> It is adviced to run `npm run watch` while developing to always build the latest version of the extension.

## Explore the API

You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`.

## Run tests

Install the [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)

Run the "watch" task via the **Tasks: Run Task*- command. Make sure this is running, or tests might not be discovered.

Open the Testing view from the activity bar and click the Run Test" button, or use the hotkey `Ctrl/Cmd + ; A`

See the output of the test result in the Test Results view.

Make changes to `src/test/extension.test.ts` or create new test files inside the `test` folder.

- The provided test runner will only consider files matching the name pattern `**.test.ts`.
- You can create folders inside the `test` folder to structure your tests any way you want.

## How does it work?

The editor is encapsulted within an iframe. Therefore all communications between the editor and external services (aka: Jupyter Service, VS Code filesystem API, VS Code UI - user input, notifications,...) involve posting message from the extension to the editor and vice-versa.

In particular to interact with Jupyter Server, once the user has provided a server URL, that information is used to create a JupyterLab `ServiceManager` in the editor (aka in the iframe) with mocked `fetch` and `WebSocket` that:

1. Serialize requests and messages.
2. Post a message to the extension.
3. The extension unserialize the content to do the actual `fetch` or to send the websocket message.
4. If needed, the extension waits for the response. Serialize it and post it back to the iframe.

## Package

This extension uses webpack to bundle both the extension and webview code. This is done by specifying two entries.

For the webview bundle, the code is bundled in a single chunk containing inline source code in non-production mode to ease debugging in the webview.

```bash
npm run package
```

## Publish

```bash
# npx @vscode/vsce package
npm run vsix
# DONE  Packaged: .../ui/packages/vscode/datalayer-jupyter-vscode-0.0.1.vsix (17 files, 1.37 MB)
```

Go to https://marketplace.visualstudio.com/manage/publishers/datalayer and upload the `vsix` file.

Optionally, run via CLI.

```bash
$ vsce publish
# datalayer.datalayer published to VS Code Marketplace
```

## References

- Custom editor sample: https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample
- Real extension using React and webviews: https://github.com/microsoft/vscode-pull-request-github
- Reduce the extension size and improve the startup time by [bundling your extension](https://code.visualstudio.com/api/working-with-extensions/bundling-extension).
- [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VS Code extension marketplace.
- Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).
