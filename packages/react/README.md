[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# Jupyter React

> Jupyter React is a set of [React.js](https://reactjs.org) components that allow a frontend developer to build data products compatible with the [Jupyter](https://jupyter.org) ecosystem. The user interface delivers executable notebooks and cells.

The below image shows a gallery of the available React.js components ready to be used in you custom application. These open source components are used to build the online [Datalayer service](https://datalayer.io), a collaborative platform for data analysis.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Gallery" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

<hr/>

## Why?

The Jupyter(Lab) notebook is a tool that allows data scientist to analyse dataset. However, it is not easy to create a custom user interface integrated in an existing application. [Jupyter React](https://jupyter-react.com), an open-source library, fills that gap and provides components that a developer can easily integrate in any React.js application.

In terms of technical stack, the Jupyter(Lab) user interface is built on top of Lumino, which is an imperative way to build user interface and **can not** be consumed by industry standard declarative frameworks like React.js. As a user interface developer, if you want to create a custom data product on top of Jupyter, you have to stick to Lumino and carry-on the full notebook interface not tailored to your specific needs. This is not what you want. You just want to expose what you need, you want to develop with your favorite toolkit (like React.js) and you also want to integrate on a per-component basis the Jupyter functionality in your application.

Although a developer can embed a React.js component into JupyterLab, the reverse is not possible: you can not embed JupyterLab into a React.js application. To solve that issue, Jupyter-React ships components to easily create a React.js data product compatible with the Jupyter ecosystem. Those components can be used in any React.js application, and also in static websites like Docusaurus, Next.js or Remix. They wrap underneath the JupyterLab code and allow developing React.js applications with code execution capability. State management is based on Redux, and Mobx is to be added.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Communication" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-communication.png" />
</div>

IPyWidgets are supported (the Comm feature needs to be fixed). JupyterLite and PyScript support is on the roadmap. Autocompletion is also available.

You can find more context reading this [abstract](https://fosdem.org/2022/schedule/event/lt_jupyter) of the talk given at [FOSDEM 2022](https://fosdem.org/2022) ([video recording](http://bofh.nikhef.nl/events/FOSDEM/2022/L.lightningtalks/lt_jupyter.webm)).

## Usage

As a React.js developer, you just write a few lines of code get a live notebook or live cell in your application.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-snippet.png" />
</div>

The `jupyter-react` library can be used in any React.js application. Install the latest `@datalayer/jupyter-react` npm package and get inspired by the [examples](https://github.com/datalayer/jupyter-react/tree/main/examples) in this repository.

<div align="center" style="text-align: center">
  <img alt="Jupyter React Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-notebook.png" />
</div>
