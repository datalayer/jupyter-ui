[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# Jupyter React

> ⚛️ [React.js](https://reactjs.org) components to create data products compatible with the [Jupyter](https://jupyter.org) ecosystem.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-slate.gif" />
</div>

You can create a custom data product `a-la-google-docs` as shown above. The below image shows a gallery of the available React.js components you ready to be used in you custom React.js application.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Gallery" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

## Usage

Install the latest `@datalayer/jupyter-react` npm package and get inspired by the [examples](./src/examples) in this repository. You can also reuse examples from this separated [jupyter-examples](https://github.com/datalayer/jupyter-examples) repository.

This library can be used to extend exsiting solutions. For example, we maintain an extension to [Docusaurus](https://docusaurus.io) in the [jupyter-docusaurus](https://github.com/datalayer/jupyter-docusaurus) repository.

The typedoc documentation is [available online](https://typedoc.datalayer.io/datalayer/jupyter-react/0.0.2).

Please open [issues](https://github.com/datalayer/jupyter-react/issues) for questions, feature requests, bug reports... We also welcome [pull requests](https://github.com/datalayer/jupyter-react/pulls).

## More

Abstract from the talk given at [FOSDEM 2022](https://fosdem.org/2022). You can find more details on https://fosdem.org/2022/schedule/event/lt_jupyter (direct link to the video recording http://bofh.nikhef.nl/events/FOSDEM/2022/L.lightningtalks/lt_jupyter.webm).

Jupyter notebook is a tool that allows Data Scientist to analyse dataset. However, it is not easy to create a custom user interface integrated in an existing application.

Jupyter React, https://github.com/datalayer/jupyter-react, an open-source library, fills that gap and provides components that a developer can easily integrate in any React.js application.

The Jupyter user interface stack is built on top of Lumino, which is an imperative way to build user interface and can not be consumed by industry standard declarative frameworks like React.js.

As a user interface developer, if you want to create a custom data product on top of Jupyter, you have to stick to Lumino and carry-on the full notebook interface not tailored to your specific needs. This is not what you want. You just want to expose what you need, you want to develop with your favortie toolkit (like React.js) and you also want to integrate on a per-component basis the Jupyter functionality in your application.

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
