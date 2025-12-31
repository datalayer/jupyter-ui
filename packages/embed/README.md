# @datalayer/jupyter-embed

> Easily embed Jupyter components (cells, notebooks, terminals, consoles) into any web page.

[![npm version](https://img.shields.io/npm/v/@datalayer/jupyter-embed.svg)](https://www.npmjs.com/package/@datalayer/jupyter-embed)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
<div data-jupyter-embed data-type="cell">
  <code data-type="source-code">
print("Hello, Jupyter!")
  </code>
</div>

<!-- Notebook from file -->
<div 
  data-jupyter-embed 
  data-type="notebook"
  data-path="notebooks/demo.ipynb"
  data-height="500px"
></div>

<!-- Terminal -->
<div 
  data-jupyter-embed 
  data-type="terminal"
  data-height="300px"
></div>
```

## Installation

### CDN (Browser)

```html
<!-- IIFE bundle (adds JupyterEmbed global) -->
<script src="https://unpkg.com/@datalayer/jupyter-embed/dist/jupyter-embed.js"></script>

<!-- ES Module -->
<script type="module">
  import { configureJupyterEmbed, initJupyterEmbeds } from 'https://unpkg.com/@datalayer/jupyter-embed/dist/jupyter-embed.esm.js';
</script>
```

### npm (Node.js / Bundler)

```bash
npm install @datalayer/jupyter-embed
# or
yarn add @datalayer/jupyter-embed
```

```javascript
import { configureJupyterEmbed, initJupyterEmbeds } from '@datalayer/jupyter-embed';

configureJupyterEmbed({
  serverUrl: 'http://localhost:8888',
  token: 'your-token'
});

initJupyterEmbeds();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverUrl` | string | `''` | Jupyter server URL |
| `wsUrl` | string | derived | WebSocket URL (auto-derived from serverUrl) |
| `token` | string | `''` | Authentication token |
| `defaultKernel` | string | `'python3'` | Default kernel name |
| `autoStartKernel` | boolean | `true` | Auto-start kernel |
| `lazyLoad` | boolean | `true` | Lazy load components when visible |
| `theme` | `'light'` \| `'dark'` | `'light'` | Theme |
| `basePath` | string | `'/'` | Base path for Jupyter server |

## Component Types

### Code Cell

```html
<div 
  data-jupyter-embed
  data-type="cell"
  data-cell-type="code"
  data-height="200px"
  data-auto-execute="false"
  data-show-toolbar="true"
  data-kernel="python3"
>
  <code data-type="source-code">
# Your Python code here
print("Hello!")
  </code>
</div>
```

**Attributes:**
- `data-cell-type`: `code` | `markdown` | `raw` (default: `code`)
- `data-height`: CSS height value
- `data-auto-execute`: Auto-run on load (default: `true`)
- `data-show-toolbar`: Show cell toolbar (default: `true`)
- `data-kernel`: Kernel name override

### Notebook

```html
<!-- From server path -->
<div 
  data-jupyter-embed
  data-type="notebook"
  data-path="path/to/notebook.ipynb"
  data-height="500px"
  data-readonly="false"
  data-show-toolbar="true"
></div>

<!-- From URL -->
<div 
  data-jupyter-embed
  data-type="notebook"
  data-url="https://example.com/notebook.ipynb"
></div>

<!-- Inline content -->
<div data-jupyter-embed data-type="notebook">
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
  data-jupyter-embed
  data-type="terminal"
  data-height="300px"
  data-color-mode="dark"
  data-terminal-name="main"
></div>
```

### Console

```html
<div 
  data-jupyter-embed
  data-type="console"
  data-height="400px"
  data-kernel="python3"
>
  <code data-type="pre-execute-code">
# Code to run on console start
import numpy as np
  </code>
</div>
```

### Output (Display Only)

```html
<div data-jupyter-embed data-type="output">
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
  lazyLoad: true
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
  autoExecute: true
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
  NotebookEmbed 
} from '@datalayer/jupyter-embed';

function App() {
  return (
    <div>
      <CellEmbed 
        options={{
          type: 'cell',
          source: 'print("Hello!")',
          autoExecute: true
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

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## License

MIT © [Datalayer](https://datalayer.io)

## Related Projects

- [@datalayer/jupyter-react](https://github.com/datalayer/jupyter-ui/tree/main/packages/react) - Full React components library
- [JupyterLab](https://github.com/jupyterlab/jupyterlab) - The full Jupyter IDE
