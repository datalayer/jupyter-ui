[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# 🪐 ⚛️ Jupyter React

> Jupyter React is a set of [React.js](https://reactjs.org) components that allow a frontend developer to build data products compatible with the [Jupyter](https://jupyter.org) ecosystem. The user interface delivers executable notebooks and cells.

> Jupyter React allows [Jupyter](https://jupyter.org) components to be embedded into [React.js](https://reactjs.org) applications as regular react components.

<div style="background-color: rgb(230,246,230); font-size: large; text-align: center; padding: 10px; margin: 10px 0 10px 0;">
Read the documentation on <a href="https://jupyter-react.datalayer.tech" target="_blank">https://jupyter-react.datalayer.tech</a>
</div>

The below image shows a gallery of the available React.js components ready to be used in you custom application. These open source components are used to build the online [Datalayer service](https://datalayer.app), a collaborative platform for data analysis.


<div align="center" style="text-align: center">
  <img alt="Jupyter React Gallery" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

<hr/>

## Why?

The Jupyter(Lab) notebook is a tool that allows data scientists to analyse datasets. However, it is not easy to create a custom user interface integrated in an existing application. [Jupyter React](https://jupyter-react.datalayer.tech), an open-source library, fills that gap and provides components that a developer can easily integrate in any React.js application.



In terms of technical stack, the Jupyter(Lab) user interface is built on top of Lumino (link?), which is an imperative way to build user interface and **can not** be consumed by industry standard declarative frameworks like React.js. As a user interface developer, if you want to create a custom data product on top of Jupyter, you have to stick to Lumino and carry-on the full notebook interface not tailored to your specific needs. This is not what you want. You just want to expose what you need, you want to develop with your favorite toolkit (like React.js) and you also want to integrate on a per-component basis the Jupyter functionality in your application.

Although a developer can embed a React.js component into JupyterLab, the reverse is not possible: you can not embed JupyterLab into a React.js application. To solve that issue, Jupyter-React ships components to easily create a React.js data product compatible with the Jupyter ecosystem. Those components can be used in any React.js application, and also in static websites like Docusaurus, Next.js or Remix. They wrap underneath the JupyterLab code and allow developing React.js applications with code execution capability. State management is based on Redux, and Mobx is to be added.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Communication" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-communication.png" />
</div>

IPyWidgets are supported (the Comm feature needs to be fixed).  JupyterLite and PyScript support is on the roadmap. Autocompletion is also available.

You can find more context reading this [abstract](https://fosdem.org/2022/schedule/event/lt_jupyter) of the talk given at [FOSDEM 2022](https://fosdem.org/2022) ([video recording](http://bofh.nikhef.nl/events/FOSDEM/2022/L.lightningtalks/lt_jupyter.webm)).

## Usage

As a React.js developer, you just write a few lines of code get a live notebook or live cell in your application.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Snipppet" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-snippet.png" />
</div>

Jupyter React can be used in any React.js application. Install the latest `@datalayer/jupyter-react` npm package and get inspired by the [examples](https://github.com/datalayer/jupyter-react/tree/main/examples) in this repository.


<div align="center" style="text-align: center">
  <img alt="Jupyter React Notebook" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-notebook.png" />
</div>

## Third party integrations

We maintain a plugin for [Docusaurus](https://docusaurus.io) in the [docusaurus](https://github.com/datalayer/jupyter-react/tree/main/packages/docusaurus) package folder (see the [Docusaurus example](https://github.com/datalayer/jupyter-react/tree/main/examples/docusaurus)).

<div align="center" style="text-align: center">
  <img alt="Jupyter React Docusaurus" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-docusaurus.png" />
</div>

## Traitlets React

As part of the jupyter-react components, we also want to ease the creation of user interfaces based on the [Jupyter Traitlets](https://traitlets.readthedocs.io). This will allow a front-end developer to start from the traits (configuration definition) defined in Python code and automatically generate a React.js user interface which can be used to manage your settings in a visual way. The traits would be converted to json-schema definitions that can be used to create the React.js components. This is particularly useful to build management user interfaces.

<hr/>

## ✍️ 🖌️ Literate Notebook

> The Literate Notebook for literate programming iscompatible with Jupyter and ObservableHQ. It can be run standalone or as Jupyter Notebook, JupyterLab, Visual Studio Code extension.

As successor to the above components wrapping JupyterLab, we are developing a brand new user interface `Literate Notebook` to better address [literate programming requirements](https://en.wikipedia.org/wiki/Literate_programming), compatible with Jupyter and ObservableHQ as envisioned by [Donald Knuth](https://en.wikipedia.org/wiki/Donald_Knuth) back in 1983.

> Literate programming is a programming paradigm introduced by Donald Knuth in which a computer program is given an explanation of its logic in a natural language, such as English, interspersed with snippets of macros and traditional source code, from which compilable source code can be generated. The approach is used in scientific computing and in data science routinely for reproducible research and open access purposes. <https://en.wikipedia.org/wiki/Literate_programming>

Instead of having the well-known cell-based structure for notebooks (each cell being a separated editor), we will provide a Notebook user-experience that will be like Notion or Google Docs. After deep exploration of Slate, Prosemirror and Lexical as the foundation for this Literate Norebook, we have chosen Lexical (see the [playground](https://playground.lexical.dev)). Non-user-interface components from JupyterLab could be reused, like the services to communicate with the server (this is what Visual Studio is reusing also). However, in the long term, the services would need to be rewritten based on a robust state-machine (for now, a lot of if-then-else have grown empirically to fit the kernel message protocols and the quality is not there unfortunately).

A a developer, you will create a custom data product `a-la-google-docs` as shown above. This `Literate Notebook` will be shipped as a standalone component, as Jupyter Notebook, JupyterLab and as Visual Studio Code extension.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-slate.gif" />
</div>

We will add collaborative and accessible features to read, write and publish data analysis to `Microsoft Office 365` and `Google Workspace`.

<hr/>

## Documentation

You can get more details on the [Jupyter React website](https://jupyter-react.datalayer.tech).

The typedoc documentation is [available online](https://typedoc.datalayer.tech/datalayer/jupyter-react/0.0.24/index.html).

## Support

Please open [issues](https://github.com/datalayer/jupyter-react/issues) for questions, feature requests, bug reports... We also welcome [pull requests](https://github.com/datalayer/jupyter-react/pulls).

## Contribute

Follow the below steps to create your development environment. You will need [Miniconda](https://docs.conda.io/en/latest/miniconda.html) up-and-running on your machine (MacOS or Linux, Windows is not supported as development platform for the time-being).

```bash
# Clone the jupyter-react repository.
git clone https://github.com/datalayer/jupyter-react.git && \
  cd jupyter-react
```

```bash
# Setup your development environment.
conda deactivate && \
  make env-rm # If you want to reset your environment.
make env && \
  conda activate datalayer
```

```bash
# Install and build.
make install build
```

```bash
# You can start an example and hack the source code.
# The changes will build automatically and will be available in your browser.
# You will have to accept to SSL certificate in your browser the first time.
echo open https://localhost:3208
yarn start
```

```bash
# We have more examples. Pick one of the following commands and enjoy.
yarn start:create-react-app      # open http://localhost:3000
yarn start:docusaurus            # open http://localhost:3000/docs/intro
yarn start:lexical               # open http://localhost:3208
# ...and some uncomplete and deprecated examples...
yarn start:slate                 # open http://localhost:3266
yarn start:prosemirror           # open http://localhost:4567
```

## ⚖️ License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
