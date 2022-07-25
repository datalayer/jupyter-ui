[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# 🪐 🦕 Jupyter Docusaurus Example

This example is built using [Docusaurus](https://docusaurus.io), a modern static website generator, and allows you to add a live cell in the Docusaurus site.

```base
yarn install &&
  echo open http://localhost:3000/docs/intro && \
  yarn start
```

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-docusaurus.png" />
</div>

```base
yarn build:docusaurus &&
  echo open http://localhost:3000 && \
  yarn serve
```

## Usage

Add the following code in any Markdown file.

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
