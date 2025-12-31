# Jupyter Embed Examples

This folder contains working examples demonstrating how to use `@datalayer/jupyter-embed`.

## Quick Start

### 1. Start a Jupyter Server

First, start a Jupyter server with CORS enabled:

```bash
jupyter lab --NotebookApp.token='test-secret' --NotebookApp.allow_origin='*' --port=8888
```

Or use the Makefile from the parent directory:

```bash
cd ..
make jupyter
```

### 2. Build and Serve Examples

From the parent directory:

```bash
# Build the package and serve examples
make example

# Or for development with hot reload
make example-dev
```

The examples will be available at: **http://localhost:3456**

## Manual Setup

If you prefer to run manually:

```bash
# Build the package
npm run build

# Install serve globally (if not already installed)
npm install -g serve

# Serve the examples folder
npx serve examples -p 3456
```

## What's Included

The `index.html` file demonstrates:

- **Configuration** - How to configure Jupyter server connection
- **Code Cells** - Interactive code cells with execution
- **Auto-execution** - Cells that run automatically on load
- **Data Visualization** - Cells with matplotlib/plotly outputs
- **Notebooks** - Full embedded notebooks
- **Terminals** - Interactive terminal sessions
- **Consoles** - Jupyter console for REPL-style interaction
- **Outputs** - Display pre-computed outputs
- **Programmatic API** - Using the JavaScript API directly

## Requirements

- **Jupyter Server**: Must be running on `http://localhost:8888`
- **Token**: Set to `test-secret` (or update in `index.html`)
- **CORS**: Must allow origin `*` or your serving domain
- **Built Package**: Run `npm run build` first

## Troubleshooting

**"Failed to connect to kernel"**
- Ensure Jupyter server is running on port 8888
- Check that the token matches (`test-secret`)
- Verify CORS is enabled with `--NotebookApp.allow_origin='*'`

**"Script not loading"**
- Make sure you built the package: `npm run build`
- Check that `../dist/jupyter-embed.js` exists
- Look in browser console for detailed errors

**"Cannot execute cells"**
- Verify the kernel name is correct (default: `python3`)
- Check browser console for kernel connection errors
- Ensure the Jupyter server has the specified kernel installed

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Learn More

- [Main README](../README.md) - Package documentation
- [Jupyter UI Docs](https://jupyter-ui.datalayer.tech) - Full documentation
- [GitHub Issues](https://github.com/datalayer/jupyter-ui/issues) - Report problems
