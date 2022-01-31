[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# Jupyter React

> ⚛️ [React.js](https://reactjs.org) components to create data products compatible with the [Jupyter](https://jupyter.org) ecosystem.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://jupyter-examples.datalayer.tech/jupyter-react-slate.gif" />
</div>

You can create a custom data product `a-la-google-docs` as shown above. The below image shows a gallery of the available React.js components you ready to be used in you custom React.js application.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Gallery" src="https://jupyter-examples.datalayer.tech/jupyter-react-gallery.gif" />
</div>

## Usage

Install the latest `@datalayer/jupyter-react` npm package and get inspired by the [examples](./src/examples) in this repository. You can also reuse examples from this separated [jupyter-examples](https://github.com/datalayer/jupyter-examples) repository.

This library can be used to extend exsiting solutions. For example, we maintain an extension to [Docusaurus](https://docusaurus.io) in the [jupyter-docusaurus](https://github.com/datalayer/jupyter-docusaurus) repository.

The typedoc documentation is [available online](https://typedoc.datalayer.io/datalayer/jupyter-react/0.0.2).

Please open [issues](https://github.com/datalayer/jupyter-react/issues) for questions, feature requests, bug reports... We also welcome [pull requests](https://github.com/datalayer/jupyter-react/pulls).

## Contribute

Follow the below steps to create your development environment. You will need [Miniconda](https://docs.conda.io/en/latest/miniconda.html) up-and-running on your machine (MacOS or Linux, Windows is not supported as development platform for the time-being).

```bash
# Clone this repository.
git clone https://github.com/datalayer/jupyter-react.git && \
  cd jupyter-react
```

```bash
# Setup your development environment.
conda deactivate && \
  make env-rm # If you want to reset your environment.
make env && \
  conda activate jupyter-react
```

```bash
# Clean, install and build.
make clean install build
```

You can launch an example and hack the source code. The changes will build automatically and will be available in your browser.

```bash
# Start the example.
echo open http://localhost:3208
yarn start
```

## License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
