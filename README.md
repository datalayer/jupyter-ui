[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 ⚛️ Jupyter UI

[![Build Status](https://github.com/datalayer/jupyter-ui/actions/workflows/build.yml/badge.svg)](https://github.com/datalayer/jupyter-ui/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/@datalayer/jupyter-react)](https://www.npmjs.com/package/@datalayer/jupyter-react)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)

<table>
<tr><td>

<a href="https://datalayer.ai"><img alt="Datalayer" src="https://assets.datalayer.tech/datalayer-25.svg" height="22"/></a>

[![Built and maintained by Datalayer](https://img.shields.io/badge/Built%20and%20maintained%20by-Datalayer%20%C2%B7%20datalayer.ai-1ABC9C?style=for-the-badge&logo=jupyter&logoColor=white&labelColor=0E7C6B)](https://datalayer.ai)

**React.js components 💯% compatible with 🪐 Jupyter.**

📖 [Documentation](https://jupyter-ui.datalayer.tech) &nbsp;·&nbsp; 🎨 [Storybook](https://jupyter-ui-storybook.datalayer.tech) &nbsp;·&nbsp; 💬 [Community](https://jupyter-ui.datalayer.tech/community)

**Free and open source, MIT** — drop the components into your own app and point them at any
Jupyter Server you already run.

Built and maintained by [**Datalayer**](https://datalayer.ai), which builds its own Notebooks
on these very components — and can host the Code Sandboxes they execute on, GPUs included, so
your product ships without a Jupyter Server to operate.

[![Discover Datalayer](https://img.shields.io/badge/%E2%86%92%20Discover%20Datalayer-datalayer.ai-1ABC9C?style=for-the-badge&labelColor=0E7C6B)](https://datalayer.ai)

</td></tr>
</table>

Jupyter UI is a set of [React.js](https://react.dev) components that allow a frontend/webapp developer to build data products compatible with the [Jupyter](https://jupyter.org) ecosystem. The user interface delivers executable notebooks, cells, terminals, file browsers and allows the developer to manage a full integrated React tree instead of relying on iframes to display the Jupyter notebooks.

## 📦 Packages

| Package                                                              | Version                                                                                                                                         | Description                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [@datalayer/jupyter-react](./packages/react)                         | [![npm](https://img.shields.io/npm/v/@datalayer/jupyter-react)](https://www.npmjs.com/package/@datalayer/jupyter-react)                         | Generic React components for Jupyter    |
| [@datalayer/jupyter-lexical](./packages/lexical)                     | [![npm](https://img.shields.io/npm/v/@datalayer/jupyter-lexical)](https://www.npmjs.com/package/@datalayer/jupyter-lexical)                     | Rich text editor with Lexical framework |
| [@datalayer/jupyter-docusaurus-plugin](./packages/docusaurus-plugin) | [![npm](https://img.shields.io/npm/v/@datalayer/jupyter-docusaurus-plugin)](https://www.npmjs.com/package/@datalayer/jupyter-docusaurus-plugin) | Docusaurus plugin for Jupyter notebooks |

## 🚀 Quick Start

### Installation

```bash
npm install @datalayer/jupyter-react
```

### Basic Usage

```tsx
import { JupyterReactTheme, Notebook } from '@datalayer/jupyter-react';

function App() {
  return (
    <JupyterReactTheme>
      <Notebook path="notebook.ipynb" id="notebook-id" startDefaultKernel />
    </JupyterReactTheme>
  );
}
```

### Collaborative Editing

Jupyter UI supports real-time collaboration through a pluggable provider system:

```tsx
import {
  Notebook,
  JupyterCollaborationProvider,
} from '@datalayer/jupyter-react';

function CollaborativeNotebook() {
  const collaborationProvider = new JupyterCollaborationProvider();

  return (
    <Notebook
      path="notebook.ipynb"
      collaborationProvider={collaborationProvider}
    />
  );
}
```

#### Creating Custom Collaboration Providers

You can create your own collaboration provider by extending `CollaborationProviderBase`:

```tsx
import { CollaborationProviderBase } from '@datalayer/jupyter-react';

class MyCustomProvider extends CollaborationProviderBase {
  constructor(config) {
    super('my-provider-type');
    // Initialize your provider
  }

  async connect(sharedModel, documentId, options) {
    // Implement your connection logic
    // Set up WebSocket, authenticate, etc.
  }
}

// Use it with any Notebook component
const provider = new MyCustomProvider({
  /* config */
});
<Notebook collaborationProvider={provider} path="notebook.ipynb" />;
```

### Development Setup

As a developer start with the [setup of your environment](https://jupyter-ui.datalayer.tech/docs/develop/setup) and try [one of the examples](https://jupyter-ui.datalayer.tech/docs/category/examples). We have [documentation](https://jupyter-ui.datalayer.tech) for more details.

```bash
# Clone the repository
git clone https://github.com/datalayer/jupyter-ui.git
cd jupyter-ui

# Install dependencies
npm install

# Build all packages
npm run build

# Start Jupyter server (required for development)
npm run jupyter:server

# Run an example
npm run jupyter:ui:vite
```

## 🎮 Try It Online

You can try the CodeSandbox examples:

- [Notebook with Create React App](https://codesandbox.io/p/sandbox/jupyter-react-cra-notebook-66r25c-66r25c)
- [Notebook with Next.js](https://codesandbox.io/p/devbox/jupyter-react-nextjs-qzv8cz)
- [Simple Cell Component](https://codesandbox.io/p/sandbox/jupyter-react-cra-cell-te6hii-te6hii) - You may need to refresh the sandbox navigator

We host a Storybook on ✨ https://jupyter-ui-storybook.datalayer.tech that showcases various low-level and high-level React.js components useful to build a Data Product.

## ✨ Features

### Core Components

- **📓 Notebook** - Full notebook interface with cells, outputs, and toolbar
- **📝 Cell** - Individual code/markdown cells with execution
- **💻 Console** - Interactive Jupyter console
- **🖥️ Terminal** - Web-based terminal interface
- **📁 FileBrowser** - File system navigation and management
- **⚙️ Kernel Management** - Kernel lifecycle and execution control
- **📊 Output Rendering** - Display of execution results, plots, and widgets

### Advanced Features

- **🔌 IPyWidgets Support** - Full support for interactive widgets
- **👥 Collaborative Editing** - Pluggable provider system supporting:
  - Jupyter collaboration (WebSocket-based with Y.js)
  - Custom providers via `ICollaborationProvider` interface
- **🎨 Theming** - JupyterLab theme support with dark/light modes
- **🔧 Extensible** - Plugin system for custom functionality
- **🚀 Performance** - Virtual scrolling, lazy loading, and optimizations
- **🔒 Security** - Token authentication, CORS, XSS protection

### Architecture Highlights

- **🏗️ Clean Architecture** - Modular, composable components with clear interfaces
- **🔄 Composition Pattern** - Components compose rather than inherit for maximum flexibility
- **🔌 Provider System** - Pluggable collaboration providers for different backends
- **📦 One-way Dependencies** - Core depends on jupyter-react, not vice versa

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

## 🔗 Framework Integrations

### Next.js

Full server-side rendering support with the [Next.js example](https://github.com/datalayer/jupyter-ui/tree/main/examples/next-js).

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Next.js" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-nextjs.png" />
</div>

### Docusaurus

We maintain a plugin for [Docusaurus](https://docusaurus.io) in the [docusaurus-plugin](https://github.com/datalayer/jupyter-ui/tree/main/packages/docusaurus-plugin) package (see the [Docusaurus example](https://github.com/datalayer/jupyter-ui/tree/main/examples/docusaurus)).

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Docusaurus" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-docusaurus.png" />
</div>

### Other Integrations

- **Vite** - Modern build tool integration ([example](https://github.com/datalayer/jupyter-ui/tree/main/examples/vite))
- **Create React App** - Classic React app setup
- **Lexical** - Rich text editing capabilities ([example](https://github.com/datalayer/jupyter-ui/tree/main/examples/lexical))
- **VS Code** - Extension for notebook editing ([package](https://github.com/datalayer/jupyter-ui/tree/main/packages/vscode))

## 📋 Requirements

- **Node.js** >= 20.0.0
- **npm** >= 8.0.0
- **Python** >= 3.8 (for Jupyter server)
- **JupyterLab** >= 4.0.0

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Run code quality checks (`npm run check`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Quality

- **TypeScript** - Strict type checking enabled
- **ESLint** - Modern flat config with React and TypeScript rules
- **Prettier** - Consistent code formatting
- **Husky** - Pre-commit hooks for quality checks
- **Commitlint** - Conventional commit messages

Run all checks with a single command:

```bash
npm run check        # Run format check, lint, and type-check
npm run check:fix    # Run format, lint fix, and type-check
```

## 💬 Support

- 📝 [Documentation](https://jupyter-ui.datalayer.tech)
- 🐛 [Issues](https://github.com/datalayer/jupyter-ui/issues)
- 💡 [Discussions](https://github.com/datalayer/jupyter-ui/discussions)
- 🎨 [Storybook](https://jupyter-ui-storybook.datalayer.tech)

## ⚖️ License

Copyright (c) 2022-2025 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](./LICENSE)).
