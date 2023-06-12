[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 ⚛️ Jupyter UI

> React.js components 💯% compatible with Jupyter.

Jupyter UI is a set of [React.js](https://react.dev) components that allow a frontend/webapp developer to build data products compatible with the [Jupyter](https://jupyter.org) ecosystem. The user interface delivers executable notebooks and cells as terminals.

<hr/>

As a developer start with the [setup of your environment](https://jupyter-ui.datalayer.tech/docs/develop/setup) and try [one of the examples](https://jupyter-ui.datalayer.tech/docs/category/examples). We have [documentation](https://jupyter-ui.datalayer.tech) for more details.

You can try an example on this [CodeSandbox](https://codesandbox.io/p/sandbox/jupyter-react-cra-example-te6hii?file=%2Fsrc%2Findex.tsx) that allows you to run code in a simple Jupyter Cell.

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Gallery" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

The above image shows a gallery of the available React.js components ready to be used in you custom application. These open source components are used to build [Datalayer](https://datalayer.io), a collaborative platform for data analysis.

## Why?

The Jupyter(Lab) notebook is a tool that allows data scientist to analyse dataset. However, it is not easy to create a custom user interface integrated in an existing application. [Jupyter UI](https://jupyter-ui.datalayer.tech), an open-source library, fills that gap and provides components that a developer can easily integrate in any React.js application.

The Jupyter(Lab) user interface is built on top of Lumino widget toolkit, an imperative way to build user interface and **can not** be consumed by industry standard declarative frameworks like React.js. As a user interface developer, if you want to create a custom data product on top of Jupyter, you have to stick to Lumino and carry-on the full notebook interface not tailored to your specific needs. This is not what you want. You just want to expose what you need, you want to develop with your favorite toolkit (like React.js) and you also want to integrate on a per-component basis the Jupyter functionality in your application.

We also aim removing the rigidity of the extension system and favor [composition over inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance).

IPyWidgets are supported (the Comm feature needs to be fixed). JupyterLite and PyScript support is on the roadmap. Autocompletion is also available.

You can find more context reading this [abstract](https://fosdem.org/2022/schedule/event/lt_jupyter) of the talk given at [FOSDEM 2022](https://fosdem.org/2022) ([video recording](http://bofh.nikhef.nl/events/FOSDEM/2022/L.lightningtalks/lt_jupyter.webm)).

## Next.js Integration

See the [Next.js example](https://github.com/datalayer/jupyter-ui/tree/main/examples/next-js).

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Docusaurus" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-nextjs.png" />
</div>

## Docusaurus Integration

We maintain a plugin for [Docusaurus](https://docusaurus.io) in the [docusaurus](https://github.com/datalayer/jupyter-ui/tree/main/packages/docusaurus-plugin) package folder (see the [Docusaurus example](https://github.com/datalayer/jupyter-ui/tree/main/examples/docusaurus)).

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Docusaurus" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-docusaurus.png" />
</div>

## Support

Please open [issues](https://github.com/datalayer/jupyter-ui/issues) for questions, feature requests, bug reports... We also welcome [pull requests](https://github.com/datalayer/jupyter-ui/pulls).

## ⚖️ License

Copyright (c) 2022 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
