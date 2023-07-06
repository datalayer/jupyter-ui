[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 🎚️ Jupyter Traitlets

> Create UI from your Jupyter Traits.

This package eases the creation of user interfaces based on the [Jupyter Traitlets](https://traitlets.readthedocs.io) configuration system and can be used to manage your application configuration in a visual way.

The traits are converted to `json-schema` definitions that can be used to create the React.js components. This is particularly useful to build management user interfaces.

PS: For now the development is done in the Jupyer Manager repository https://github.com/datalayer/jupyter-manager for convenience and will move back in the Jupyter UI repository https://github.com/datalayer/jupyter-ui as soon as possible.

```bash
pip install -e .[test]
jupyter labextension develop . --overwrite
jupyter labextension list
jupyter server extension list
yarn jupyterlab
```
