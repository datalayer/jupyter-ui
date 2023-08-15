[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 🏄 Jupyter Dashboard

> Create and publish Dashboard from Jupyter.

A [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG) dashboard editor.

<div align="center" style="text-align: center">
  <img alt="Jupyter Dashboard Editor" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-dashboard-editor.gif" />
</div>

```bash
yarn
yarn build
# open http://localhost:3063
# open http://localhost:8686/api/jupyter/lab?token=60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6
yarn start
```

```bash
pip install -e .[test]
jupyter labextension develop . --overwrite
jupyter labextension list
jupyter server extension list
# open http://localhost:8686/api/jupyter/lab?token=60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6
yarn jupyterlab
```
