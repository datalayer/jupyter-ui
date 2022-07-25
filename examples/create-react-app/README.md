[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# 🪐 ⚛️ Jupyter React Example

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

A `create-react-app` requests coherent react.js versions. With JupyterLab, we are pulling various version in the node_modules subfolders. To avoid version conflicts, the `resolutions` in `package.json` specifies the needed version.

### Fix JupyterLab dependency definitions

Run `make install`. This will apply the following temporary patch on the JupyterLab dependency type definitions.

```bash
echo "The following is a temporary fix tested on MacOS - For other OS, you may need to fix manually"
sed -i.bu "s|k: keyof TableOfContents.IConfig|k: string|g" node_modules/\@jupyterlab/notebook/lib/toc.d.ts
sed -i.bu "s|uri: DocumentUri|uri: string|g" node_modules/vscode-languageserver-protocol/lib/common/protocol.diagnostic.d.ts
sed -i.bu "s|uri: DocumentUri|uri: string|g" node_modules/vscode-languageserver-types/lib/umd/main.d.ts
sed -i.bu "s|id: ChangeAnnotationIdentifier|uri: string|g" node_modules/vscode-languageserver-types/lib/umd/main.d.ts
```

## ⚖️ License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
