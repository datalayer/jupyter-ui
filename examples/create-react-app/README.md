[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# 🪐 ⚛️ Jupyter Create React Example

Example to showcase [Jupyter React](https://github.com/datalayer/jupyter-react) usage in a [Create React](https://reactjs.org/docs/create-a-new-react-app.html) application.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Gallery" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

## Environment

Follow the below steps to create your development environment as documented on https://github.com/datalayer/jupyter-react#contribute.

## Create your own create-react-app (version 5)

You can create your own app and add the Datalayer Jupyter React dependency.

```bash
npx create-react-app jupyter-react-example --template typescript && \
  cd jupyter-react-example && \
  yarn add @datalayer/jupyter-react
```

Once this is done, double-check the following requirements (just checkout this repository for a complete setup).

### Startup Scripts

You will need a Jupyter server up-and-running. We ship the configuration and scripts in this repository. You can add in your `package.json` the needed definitions.

```json
  "scripts": {
    "start": "run-p -c start:*",
    "start:jupyter": "make start-jupyter-server",
    "start:react": "react-scripts start",
  },
  "devDependencies": {
    "npm-run-all": "4.1.5",
  },
```

### Dot Env

It looks like the `create-react-app` version 5 does not like sourcemaps pointing to non existing source code. To avoid error messages, please create a `.env` file at the top of your folder/repositoriy and add there `GENERATE_SOURCEMAP=false`.

```dotenv
// .env
GENERATE_SOURCEMAP=false
```

### Metadata in index.html

You need to add in the `public/index.html` the needed information to indicate where you Jupyter server is running.

```html
    <script id="datalayer-config-data" type="application/json">
      {
        "jupyterServerHttpUrl": "http://localhost:8686/api/jupyter",
        "jupyterServerWsUrl": "ws://localhost:8686/api/jupyter",
        "jupyterToken": "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      }
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js"></script>
```

### React.js version resolutions

A `create-react-app` requests coherent React.js versions othewise you may hit the `Invalid Hook Call Warning` with `mismatching versions of React and React DOM` as documented on [this page](https://reactjs.org/warnings/invalid-hook-call-warning.html).

With JupyterLab, we are pulling various version in the node_modules subfolders. To avoid version conflicts, set the `dependencies` and `resolutions` in `package.json` to explicitely specificy the needed versions.

```json
  "dependencies": {
    "react": "18.1.0",
    "react-dom": "18.1.0"
  },
  "resolutions": {
    "**/@types/react": "18.0.9",
    "**/@types/react-dom": "18.0.5",
    "**/react": "18.1.0",
    "**/react-dom": "18.1.0"
  },
```

### JupyterLab version resolutions

JupyerLab is actively developed. We are tracking the latest releases as closely as possible.

Therefor, for now, we ask to pin the following resolutions.

```json
  "resolutions": {
    "**/@jupyter-widgets/base": "6.0.1",
    "**/@jupyter-widgets/controls": "5.0.1",
    "**/@jupyter-widgets/html-manager": "1.0.3",
    "**/@jupyter-widgets/jupyterlab-manager": "5.0.3",
    "**/@jupyter-widgets/output": "6.0.1",
    "**/@jupyterlab/application": "4.0.0-alpha.13",
    "**/@jupyterlab/apputils": "4.0.0-alpha.13",
    "**/@jupyterlab/cells": "4.0.0-alpha.13",
    "**/@jupyterlab/codeeditor": "4.0.0-alpha.13",
    "**/@jupyterlab/codemirror": "4.0.0-alpha.13",
    "**/@jupyterlab/completer": "4.0.0-alpha.13",
    "**/@jupyterlab/console": "4.0.0-alpha.13",
    "**/@jupyterlab/coreutils": "6.0.0-alpha.13",
    "**/@jupyterlab/docmanager": "4.0.0-alpha.13",
    "**/@jupyterlab/docprovider": "4.0.0-alpha.13",
    "**/@jupyterlab/docregistry": "4.0.0-alpha.13",
    "**/@jupyterlab/documentsearch": "4.0.0-alpha.13",
    "**/@jupyterlab/filebrowser": "4.0.0-alpha.13",
    "**/@jupyterlab/fileeditor": "4.0.0-alpha.13",
    "**/@jupyterlab/inspector": "4.0.0-alpha.13",
    "**/@jupyterlab/javascript-extension": "4.0.0-alpha.13",
    "**/@jupyterlab/json-extension": "4.0.0-alpha.13",
    "**/@jupyterlab/launcher": "4.0.0-alpha.13",
    "**/@jupyterlab/lsp": "4.0.0-alpha.13",
    "**/@jupyterlab/mainmenu": "4.0.0-alpha.13",
    "**/@jupyterlab/markdownviewer": "4.0.0-alpha.13",
    "**/@jupyterlab/markedparser-extension": "4.0.0-alpha.13",
    "**/@jupyterlab/mathjax2": "4.0.0-alpha.13",
    "**/@jupyterlab/nbconvert-css": "4.0.0-alpha.13",
    "**/@jupyterlab/nbformat": "4.0.0-alpha.13",
    "**/@jupyterlab/notebook": "4.0.0-alpha.13",
    "**/@jupyterlab/observables": "5.0.0-alpha.13",
    "**/@jupyterlab/outputarea": "4.0.0-alpha.13",
    "**/@jupyterlab/rendermime": "4.0.0-alpha.13",
    "**/@jupyterlab/rendermime-extension": "4.0.0-alpha.13",
    "**/@jupyterlab/rendermime-interfaces": "3.8.0-alpha.13",
    "**/@jupyterlab/services": "7.0.0-alpha.13",
    "**/@jupyterlab/settingregistry": "4.0.0-alpha.13",
    "**/@jupyterlab/statedb": "4.0.0-alpha.13",
    "**/@jupyterlab/terminal": "4.0.0-alpha.13",
    "**/@jupyterlab/theme-dark-extension": "4.0.0-alpha.13",
    "**/@jupyterlab/theme-light-extension": "4.0.0-alpha.13",
    "**/@jupyterlab/translation": "4.0.0-alpha.13",
    "**/@jupyterlab/ui-components": "4.0.0-alpha.28",
    "**/@lumino/default-theme": "1.0.0-alpha.4",
    "**/@lumino/algorithm": "2.0.0-alpha.4",
    "**/@lumino/application": "2.0.0-alpha.4",
    "**/@lumino/collections": "2.0.0-alpha.4",
    "**/@lumino/commands": "2.0.0-alpha.4",
    "**/@lumino/coreutils": "2.0.0-alpha.4",
    "**/@lumino/default-theme": "1.0.0-alpha.4",
    "**/@lumino/disposable": "2.0.0-alpha.4",
    "**/@lumino/domutils": "2.0.0-alpha.4",
    "**/@lumino/dragdrop": "2.0.0-alpha.4",
    "**/@lumino/keyboard": "2.0.0-alpha.4",
    "**/@lumino/messaging": "2.0.0-alpha.4",
    "**/@lumino/polling": "2.0.0-alpha.4",
    "**/@lumino/properties": "2.0.0-alpha.4",
    "**/@lumino/signaling": "2.0.0-alpha.4",
    "**/@lumino/virtualdom": "2.0.0-alpha.4",
    "**/@lumino/widgets": "2.0.0-alpha.4"
  }
```

## Add dependencies

This example uses Material UI. You can add for example in package.json the following dependencies.

```json
    "@emotion/react": "11.4.0",
    "@emotion/styled": "11.3.0",
    "@mui/material": "5.8.3",
    "@mui/icons-material": "5.8.3",
    "@mui/lab": "5.0.0-alpha.85",
    "@mui/styles": "5.8.3",
    "@mui/system": "5.8.3",
```

## Strict Mode

We don't fully support yet React [Strict Mode](https://reactjs.org/docs/strict-mode.html) (can be useful in development mode). Please remove any reference of `StrictMode` in your source.

## ⚖️ License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
