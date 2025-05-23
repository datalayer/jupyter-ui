[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

[![Build Status](https://travis-ci.org/datalayer/ipyscript.svg?branch=master)](https://travis-ci.org/datalayer/ipyscript)
[![codecov](https://codecov.io/gh/datalayer/ipyscript/branch/master/graph/badge.svg)](https://codecov.io/gh/datalayer/ipyscript)

# 🪐 🐉 IPyScript

> IPyWidgets for PyScript.

A Custom Jupyter Widget Library.

## Examples

Examples of ipyscript projects:

- https://leriomaggio.pyscriptapps.com/simple-panel-application/latest/
- https://pyscript.com/@leriomaggio/simple-panel-application/latest

## Installation

You can install using `pip`:

```bash
pip install ipyscript
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] ipyscript
```

## Development Installation

Create a dev environment:
```bash
conda create -n ipyscript-dev -c conda-forge nodejs npm python jupyterlab
conda activate ipyscript-dev
```

Install the python. This will also build the TS package.
```bash
pip install -e ".[test, examples]"
```

When developing your extensions, you need to manually enable your extensions with the
notebook / lab frontend. For lab, this is done by the command:

```
jupyter labextension develop --overwrite .
npm run build
```

For classic notebook, you need to run:

```
jupyter nbextension install --sys-prefix --symlink --overwrite --py ipyscript
jupyter nbextension enable --sys-prefix --py ipyscript
```

Note that the `--symlink` flag doesn't work on Windows, so you will here have to run
the `install` command every time that you rebuild your extension. For certain installations
you might also need another flag instead of `--sys-prefix`, but we won't cover the meaning
of those flags here.

### How to see your changes
#### Typescript:
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
npm run watch
# Run JupyterLab in another terminal
jupyter lab
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.
