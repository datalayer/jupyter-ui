[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 🦕 Jupyter Plugin for Docusaurus

> Docusaurus Plugin to create a Jupyter Cell in a Docusaurus site.

See an example in [this repository](https://github.com/datalayer/jupyter-ui/tree/main/examples/docusaurus).

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-docusaurus.png" />
</div>

## Installation

```sh
yarn add @datalayer/jupyter-docusaurus-plugin
```

Modify your `docusaurus.config.js`

```diff
module.exports = {
  ...
+ plugins: ['@datalayer/jupyter-docusaurus-plugin'],
  ...
}
```

## Usage

Add the following in any Markdown file.

```jsx
import JupyterCell from '@theme/JupyterCell';

<JupyterCell 
  source={`print('Hello world')
for i in range(10):
  print(i)
`}
  token='60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6'
  serverHttpUrl='http://localhost:8686/api/jupyter'
  serverWsUrl='ws://localhost:8686/api/jupyter'
/>
```

## ⚖️ License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
