[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 ⚛️ Jupyter UI

> Jupyter UI is a set of [React.js](https://reactjs.org) components that allow a frontend developer to build data products compatible with the [Jupyter](https://jupyter.org) ecosystem. The user interface delivers executable notebooks and cells.

<div style="background-color: rgb(230,246,230); font-size: large; text-align: center; padding: 10px; margin: 10px 0 10px 0;">
Read the documentation on <a href="https://jupyter-ui.datalayer.tech" target="_blank">https://jupyter-ui.datalayer.tech</a>
</div>

Try it on this [CodeSandbox](https://codesandbox.io/p/sandbox/jupyter-react-cra-example-zygjbm?file=%2Fsrc%2Findex.tsx).

The below image shows a gallery of the available React.js components ready to be used in you custom application. These open source components are used to build the online [Datalayer service](https://datalayer.app), a collaborative platform for data analysis.

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Gallery" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

<hr/>

## Why?

> Stop extending, compose instead (cfr [Composition over inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance))

The Jupyter(Lab) notebook is a tool that allows data scientist to analyse dataset. However, it is not easy to create a custom user interface integrated in an existing application. [Jupyter UI](https://jupyter-ui.datalayer.tech), an open-source library, fills that gap and provides components that a developer can easily integrate in any React.js application.

In terms of technical stack, the Jupyter(Lab) user interface is built on top of Lumino, which is an imperative way to build user interface and **can not** be consumed by industry standard declarative frameworks like React.js. As a user interface developer, if you want to create a custom data product on top of Jupyter, you have to stick to Lumino and carry-on the full notebook interface not tailored to your specific needs. This is not what you want. You just want to expose what you need, you want to develop with your favorite toolkit (like React.js) and you also want to integrate on a per-component basis the Jupyter functionality in your application.

IPyWidgets are supported (the Comm feature needs to be fixed). JupyterLite and PyScript support is on the roadmap. Autocompletion is also available.

You can find more context reading this [abstract](https://fosdem.org/2022/schedule/event/lt_jupyter) of the talk given at [FOSDEM 2022](https://fosdem.org/2022) ([video recording](http://bofh.nikhef.nl/events/FOSDEM/2022/L.lightningtalks/lt_jupyter.webm)).

## Third party integrations

We maintain a plugin for [Docusaurus](https://docusaurus.io) in the [docusaurus](https://github.com/datalayer/jupyter-react/tree/main/packages/docusaurus) package folder (see the [Docusaurus example](https://github.com/datalayer/jupyter-react/tree/main/examples/docusaurus)).

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Docusaurus" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-docusaurus.png" />
</div>

## Documentation

You can get more details on the [Jupyter UI website](https://jupyter-ui.datalayer.tech).

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
# JupyterLab has migrated to Yarn v3, we need Yarn v1 for resolutions and ease of vs-code usage.
curl https://raw.githubusercontent.com/jupyterlab/jupyterlab/v4.0.0a36/jupyterlab/staging/yarn.js \
 -o $( dirname "$(which jupyter)" )/../lib/python3.10/site-packages/jupyterlab/staging/yarn.js
jlpm --version # Should be 1.22.19.
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
yarn jupyter:example:cra                   # open http://localhost:3000
yarn jupyter:example:lexical               # open http://localhost:3208
yarn jupyter:example:docusaurus            # open http://localhost:3000/docs/intro
# ...and some uncomplete or deprecated examples...
yarn jupyter:example:slate                 # open http://localhost:3266
yarn jupyter:example:prosemirror           # open http://localhost:4567
```

## ⚖️ License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
