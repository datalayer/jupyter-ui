[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 🌐 Jupyter Embed

> Easily embed Jupyter components (cells, notebooks, terminals, consoles) into any web page.

[![npm version](https://img.shields.io/npm/v/@datalayer/jupyter-embed.svg)](https://www.npmjs.com/package/@datalayer/jupyter-embed)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🚀 Live Demo:** [jupyter-embed.datalayer.tech](https://jupyter-embed.datalayer.tech)

## Overview

`@datalayer/jupyter-embed` allows you to convert any website or blog into an interactive Jupyter-powered learning platform. Simply add a script tag and HTML elements with data attributes to embed:

- **Code Cells** - Interactive Python/Julia/R cells with execution
- **Notebooks** - Full Jupyter notebooks with all features
- **Terminals** - Interactive terminal sessions
- **Consoles** - Jupyter console for REPL-style interaction
- **Outputs** - Display pre-computed Jupyter outputs

Powered by the full Jupyter ecosystem via `@datalayer/jupyter-react`.

## Quick Start

### 1. Include the Script

Add the script to your HTML page:

```html
<script src="https://unpkg.com/@datalayer/jupyter-embed/dist/jupyter-embed.js"></script>
```

### 2. Configure the Connection

```html
<script type="application/json" data-jupyter-embed-config>
  {
    "serverUrl": "http://localhost:8888",
    "token": "your-jupyter-token",
    "defaultKernel": "python3"
  }
</script>
```

Or via data attributes on the script tag:

```html
<script
  src="jupyter-embed.js"
  data-server-url="http://localhost:8888"
  data-token="your-token"
></script>
```

### 3. Add Embed Elements

```html
<!-- Code Cell -->
<div
  data-jupyter-embed="cell"
  data-jupyter-height="200px"
  data-jupyter-auto-execute="true"
>
  <code data-jupyter-source-code> print("Hello, Jupyter!") </code>
</div>

<!-- Notebook from file -->
<div
  data-jupyter-embed="notebook"
  data-jupyter-path="notebooks/demo.ipynb"
  data-jupyter-height="500px"
></div>

<!-- Terminal -->
<div data-jupyter-embed="terminal" data-jupyter-height="300px"></div>
```

## Installation

### CDN (Browser)

```html
<!-- IIFE bundle (adds JupyterEmbed global) -->
<script src="https://unpkg.com/@datalayer/jupyter-embed/dist/jupyter-embed.js"></script>

<!-- ES Module -->
<script type="module">
  import {
    configureJupyterEmbed,
    initJupyterEmbeds,
  } from 'https://unpkg.com/@datalayer/jupyter-embed/dist/jupyter-embed.esm.js';
</script>
```

### ESM Build with Vendor Chunking (Recommended for Production)

For better caching and faster repeat visits, use the chunked ESM build:

```html
<!-- ESM build with automatic chunk loading -->
<script
  type="module"
  src="https://cdn.example.com/jupyter-embed.esm.js"
></script>
```

The ESM build automatically loads vendor chunks on demand:

| Chunk                 | Size   | Gzipped | Description       |
| --------------------- | ------ | ------- | ----------------- |
| `vendor-react`        | 822 KB | 177 KB  | React/ReactDOM    |
| `vendor-codemirror`   | 1.7 MB | 579 KB  | CodeMirror editor |
| `vendor-jupyter-core` | 1.2 MB | 300 KB  | JupyterLab core   |
| `vendor-mathjax`      | 864 KB | 203 KB  | Math rendering    |
| `vendor-xterm`        | 489 KB | 119 KB  | Terminal emulator |
| `vendor-lumino`       | 200 KB | 49 KB   | Lumino widgets    |

**Benefits:**

- Vendor chunks are cached independently (they rarely change)
- Browser loads chunks in parallel
- Only changed code needs re-downloading on updates

Build the ESM version with:

```bash
npm run build:esm
```

### npm (Node.js / Bundler)

```bash
npm install @datalayer/jupyter-embed
# or
yarn add @datalayer/jupyter-embed
```

```javascript
import {
  configureJupyterEmbed,
  initJupyterEmbeds,
} from '@datalayer/jupyter-embed';

configureJupyterEmbed({
  serverUrl: 'http://localhost:8888',
  token: 'your-token',
});

initJupyterEmbeds();
```

## Configuration Options

| Option            | Type                  | Default     | Description                                 |
| ----------------- | --------------------- | ----------- | ------------------------------------------- |
| `serverUrl`       | string                | `''`        | Jupyter server URL                          |
| `wsUrl`           | string                | derived     | WebSocket URL (auto-derived from serverUrl) |
| `token`           | string                | `''`        | Authentication token                        |
| `defaultKernel`   | string                | `'python3'` | Default kernel name                         |
| `autoStartKernel` | boolean               | `true`      | Auto-start kernel                           |
| `lazyLoad`        | boolean               | `true`      | Lazy load components when visible           |
| `theme`           | `'light'` \| `'dark'` | `'light'`   | Theme                                       |
| `basePath`        | string                | `'/'`       | Base path for Jupyter server                |

## Attribute Convention

All attributes use the `data-jupyter-*` prefix for clarity and to avoid conflicts with other libraries.

### Attribute Patterns

| Component    | Source Code                                              | Auto-Execute                | Height                |
| ------------ | -------------------------------------------------------- | --------------------------- | --------------------- |
| **Cell**     | `data-jupyter-code` or `<code data-jupyter-source-code>` | `data-jupyter-auto-execute` | `data-jupyter-height` |
| **Output**   | `data-jupyter-code` or `<code data-jupyter-source-code>` | `data-jupyter-auto-run`     | `data-jupyter-height` |
| **Terminal** | N/A                                                      | N/A                         | `data-jupyter-height` |
| **Notebook** | N/A                                                      | N/A                         | `data-jupyter-height` |
| **Console**  | `<code data-jupyter-pre-execute-code>`                   | N/A                         | `data-jupyter-height` |

### Backward Compatibility

Short-form attributes (without `data-jupyter-` prefix) are also supported for backward compatibility:

| Prefixed Form (Recommended)       | Short Form (Legacy)                       |
| --------------------------------- | ----------------------------------------- |
| `data-jupyter-embed="cell"`       | `data-jupyter-embed` + `data-type="cell"` |
| `data-jupyter-height`             | `data-height`                             |
| `data-jupyter-auto-execute`       | `data-auto-execute`                       |
| `data-jupyter-code`               | `data-source` or `data-code`              |
| `<code data-jupyter-source-code>` | `<code data-type="source-code">`          |

## Component Types

### Code Cell

```html
<div
  data-jupyter-embed="cell"
  data-jupyter-cell-type="code"
  data-jupyter-height="200px"
  data-jupyter-auto-execute="true"
  data-jupyter-show-toolbar="true"
  data-jupyter-kernel="python3"
>
  <code data-jupyter-source-code>
    # Your Python code here print("Hello!")
  </code>
</div>
```

Or using inline code attribute:

```html
<div
  data-jupyter-embed="cell"
  data-jupyter-code="print('Hello!')"
  data-jupyter-height="200px"
  data-jupyter-auto-execute="true"
></div>
```

**Attributes:**

- `data-jupyter-cell-type`: `code` | `markdown` | `raw` (default: `code`)
- `data-jupyter-height`: CSS height value
- `data-jupyter-auto-execute`: Auto-run on load (default: `true`)
- `data-jupyter-show-toolbar`: Show cell toolbar (default: `true`)
- `data-jupyter-kernel`: Kernel name override

### Notebook

```html
<!-- From server path -->
<div
  data-jupyter-embed="notebook"
  data-jupyter-path="path/to/notebook.ipynb"
  data-jupyter-height="500px"
  data-jupyter-readonly="false"
  data-jupyter-show-toolbar="true"
></div>

<!-- From URL -->
<div
  data-jupyter-embed="notebook"
  data-jupyter-url="https://example.com/notebook.ipynb"
></div>

<!-- Inline content -->
<div data-jupyter-embed="notebook">
  <script type="application/json">
    {
      "cells": [...],
      "metadata": {...},
      "nbformat": 4,
      "nbformat_minor": 4
    }
  </script>
</div>
```

### Terminal

```html
<div
  data-jupyter-embed="terminal"
  data-jupyter-height="300px"
  data-jupyter-color-mode="dark"
  data-jupyter-terminal-name="main"
></div>
```

### Console

```html
<div
  data-jupyter-embed="console"
  data-jupyter-height="400px"
  data-jupyter-kernel="python3"
>
  <code data-jupyter-pre-execute-code>
    # Code to run on console start import numpy as np
  </code>
</div>
```

### Output (Display Only)

```html
<!-- Execute code and display output -->
<div
  data-jupyter-embed="output"
  data-jupyter-height="300px"
  data-jupyter-auto-run="true"
>
  <code data-jupyter-source-code>
    import matplotlib.pyplot as plt import numpy as np x = np.linspace(0, 10,
    100) plt.plot(x, np.sin(x)) plt.title('Sine Wave') plt.show()
  </code>
</div>

<!-- Or with inline code attribute -->
<div
  data-jupyter-embed="output"
  data-jupyter-code="print('Hello, World!')"
  data-jupyter-auto-run="true"
></div>

<!-- Pre-computed output (no execution) -->
<div data-jupyter-embed="output">
  <script type="application/json">
    [
      {
        "output_type": "stream",
        "name": "stdout",
        "text": "Hello, World!\n"
      }
    ]
  </script>
</div>
```

## JavaScript API

```javascript
// Configure connection
JupyterEmbed.configureJupyterEmbed({
  serverUrl: 'http://localhost:8888',
  token: 'your-token',
  defaultKernel: 'python3',
  lazyLoad: true,
});

// Initialize all embeds in page
JupyterEmbed.initJupyterEmbeds();

// Initialize embeds in a specific container (e.g., after AJAX load)
JupyterEmbed.initAddedJupyterEmbeds(containerElement);

// Render programmatically
const element = document.getElementById('my-embed');
JupyterEmbed.renderEmbed(element, {
  type: 'cell',
  source: 'print("Hello")',
  autoExecute: true,
});

// Unmount specific embed
JupyterEmbed.unmountEmbed(element);

// Destroy all embeds
JupyterEmbed.destroyJupyterEmbeds();
```

## React Integration

For React applications, you can use the components directly:

```jsx
import {
  JupyterWrapper,
  CellEmbed,
  NotebookEmbed,
} from '@datalayer/jupyter-embed';

function App() {
  return (
    <div>
      <CellEmbed
        options={{
          type: 'cell',
          source: 'print("Hello!")',
          autoExecute: true,
        }}
      />
    </div>
  );
}
```

Or use the full `@datalayer/jupyter-react` library for more control.

## Styling

Hide uninitialized embeds to prevent flash of unstyled content:

```css
[data-jupyter-embed]:not([data-jupyter-initialized]) {
  visibility: hidden;
  min-height: 100px;
}
```

## Requirements

- A running Jupyter server with:
  - CORS configured to allow your domain
  - Token authentication or no authentication
  - WebSocket support enabled

### Example Jupyter Server Configuration

```python
# jupyter_server_config.py
c.ServerApp.allow_origin = '*'
c.ServerApp.allow_credentials = True
c.ServerApp.token = 'your-secure-token'
c.ServerApp.disable_check_xsrf = True
```

Or start with:

```bash
jupyter server --ServerApp.allow_origin='*' --ServerApp.token='your-token'
```

## Browser Support

### IIFE Build (Single File)

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

### ESM Build (Chunked)

- Chrome 61+ (ES modules support)
- Firefox 60+
- Safari 11+
- Edge 79+

## Build Outputs

| Build         | Command             | Output                      | Size                | Use Case                    |
| ------------- | ------------------- | --------------------------- | ------------------- | --------------------------- |
| IIFE          | `npm run build`     | `dist/jupyter-embed.js`     | 13 MB (3.4 MB gzip) | Simple script tag inclusion |
| ESM (single)  | `npm run build`     | `dist/jupyter-embed.esm.js` | 13 MB (3.4 MB gzip) | ES module import            |
| ESM (chunked) | `npm run build:esm` | `dist-esm/`                 | 11 MB total         | Production with caching     |

## License

MIT © [Datalayer](https://datalayer.io)

## Related Projects

- [@datalayer/jupyter-react](https://github.com/datalayer/jupyter-ui/tree/main/packages/react) - Full React components library
- [JupyterLab](https://github.com/jupyterlab/jupyterlab) - The full Jupyter IDE
