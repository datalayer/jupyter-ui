[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# Jupyter UI Traitlets

🪐 ⚛️ Create UI for your Jupyter Traits

This package eases the creation of user interfaces based on the [Jupyter Traitlets](https://traitlets.readthedocs.io) configuration system.

This allows a developer to start from the traits (configuration definition) defined in Python code and automatically generate a `React.js` user interface which can be used to manage your settings in a visual way. The traits would be converted to `json-schema` definitions that can be used to create the React.js components.

This is particularly useful to build management user interfaces.

```bash
pip install -e .[test]
jupyter labextension develop . --overwrite
jupyter labextension list
jupyter server extension list
yarn jupyterlab
```
