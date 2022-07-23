[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# 🪐 ☀️ Jupyter React

> ⚛️ [React.js](https://reactjs.org) components to create data products compatible with the [Jupyter](https://jupyter.org) ecosystem.

The below image shows a gallery of the available React.js components you ready to be used in you custom React.js application.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

The Jupyter notebook is a tool that allows data scientist to analyse dataset. However, it is not easy to create a custom user interface integrated in an existing application. [Jupyter React](https://jupyter-react.com), an open-source library, fills that gap and provides components that a developer can easily integrate in any React.js application.

The JupyterLab user interface stack is built on top of Lumino, which is an imperative way to build user interface and **can not** be consumed by industry standard declarative frameworks like React.js. As a user interface developer, if you want to create a custom data product on top of Jupyter, you have to stick to Lumino and carry-on the full notebook interface not tailored to your specific needs. This is not what you want. You just want to expose what you need, you want to develop with your favorite toolkit (like React.js) and you also want to integrate on a per-component basis the Jupyter functionality in your application. You can find more context reading this [abstract](https://fosdem.org/2022/schedule/event/lt_jupyter) of the talk given at [FOSDEM 2022](https://fosdem.org/2022) ([video recording](http://bofh.nikhef.nl/events/FOSDEM/2022/L.lightningtalks/lt_jupyter.webm)).

Although a developer can embed a React.js component into JupyterLab, the reverse is not possible: you can not embed JupyterLab into a React.js application. To solve that issue, Jupyter-React ships components to easily create a React.js data product compatible with the Jupyter ecosystem. Those components can be used in any React.js application, and also in static websites like Docusaurus, Next.js or Remix. They wrap underneath the JupyterLab code and allow developing React.js applications with code execution capability. State management is based on Redux, and Mobx is to be added.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-communication.png" />
</div>

IPyWidgets are supported; the Comm feature needs to be fixed. JupyterLite and PyScript support is on the roadmap. Autocompletion is also available.

The developer can now get a notebook or a cell in his page with a few lines of code.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-snippet.png" />
</div>

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-notebook.png" />
</div>

## Usage

Install the latest `@datalayer/jupyter-react` npm package and get inspired by the [examples](./src/examples) in this repository. You can also reuse examples from this separated [jupyter-examples](https://github.com/datalayer/jupyter-examples) repository.

This library can be used to extend exsiting solutions. For example, we maintain an plugin to [Docusaurus](https://docusaurus.io) in the [examples/docusarus](./examples/docusarus) folder.

## Literate Notebook

> ✍️ A notebook for literate programming, compatible with Jupyter and ObservableHQ. The literate notebook can be run standalone or as Jupyter Notebook, JupyterLab, Visual Studio Code extension

As a successor to those components wrapping JupyterLab, we are developing a brand new user interface `Literate Notebook` to better address [literate programming requirements](https://en.wikipedia.org/wiki/Literate_programming), compatible with Jupyter and ObservableHQ as envisioned by [Donald Knuth](https://en.wikipedia.org/wiki/Donald_Knuth) back in 1983.

> Literate programming is a programming paradigm introduced by Donald Knuth in which a computer program is given an explanation of its logic in a natural language, such as English, interspersed with snippets of macros and traditional source code, from which compilable source code can be generated. The approach is used in scientific computing and in data science routinely for reproducible research and open access purposes. <https://en.wikipedia.org/wiki/Literate_programming>

Instead of having the well-known cell-based structure for notebooks (each cell being a separated editor), we will provide a Notebook user-experience that will be like Notion or Google Docs. After deep exploration of Slate, Prosemirror and Lexical as the foundation for this Literate Norebook, we have chosen Lexical (see the current playground https://playground.lexical.dev). Non-user-interface components from JupyterLab could be reused, like the services to communicate with the server (this is what Visual Studio is reusing also). However, in the long term, the services would need to be rewritten based on a robust state-machine (for now, a lot of if-then-else have grown empirically to fit the kernel message protocols and the quality is not there unfortunately).

A a developer, you will create a custom data product `a-la-google-docs` as shown above. This `Literate Notebook` will be shipped as a standalone component, as Jupyter Notebook, JupyterLab and as Visual Studio Code extension.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-slate.gif" />
</div>

We will add collaborative and accessible features to read, write and publish data analysis to Office-365 and Google workspace.

## Traitlets React

As part of the jupyter-react components, we also want to ease the creation of user interfaces based on the Jupyter Traits. This will allow a front-end developer to start from the traits (configuration definition) defined in Python code and automatically generate a React.js user interface which can be used to manage your settings in a visual way. The traits would be converted to json-schema definitions that can be used to create the React.js components. This is particularly useful to build management user interfaces.

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

```bash
# You can start an example and hack the source code.
# The changes will build automatically and will be available in your browser.
echo open http://localhost:3208
yarn start
```

The typedoc documentation is [available online](https://typedoc.datalayer.tech/datalayer/jupyter-react/0.0.2). Please open [issues](https://github.com/datalayer/jupyter-react/issues) for questions, feature requests, bug reports... We also welcome [pull requests](https://github.com/datalayer/jupyter-react/pulls).

## ⚖️ License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
