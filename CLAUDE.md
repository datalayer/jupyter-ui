# Jupyter UI - Quick Reference

## Overview

React component library for Jupyter notebooks. Monorepo with 4 main packages.

## Commands

```bash
# Setup
npm install
npm run build

# Development
npm run jupyter:server       # Start Jupyter (port 8686)
npm run storybook           # Start Storybook (port 6006)

# React package dev (cd packages/react)
npm run start               # Remote server config
npm run start-local         # Local server (webpack + jupyter)
npm run start-local:webpack # Only webpack

# Code quality
npm run check               # Format, lint, type-check
npm run check:fix          # Auto-fix and check
```

## Key Info

- **Node.js**: >= 20.0.0 (use .nvmrc)
- **Server token**: `60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6`
- **Webpack entry**: Edit `packages/react/webpack.config.js` → `ENTRY` variable
- **Jupyter config**: `dev/config/jupyter_server_config.py`

## Collaboration Setup

1. Install: `pip install jupyter-collaboration jupyterlab`
2. Enable: Set `c.LabApp.collaborative = True` in jupyter config
3. Test: Open http://localhost:3208/ in multiple windows

## Collaboration Providers

```tsx
// Basic usage
const provider = new JupyterCollaborationProvider();
<Notebook collaborationProvider={provider} path="notebook.ipynb" />;

// With config
const provider = new JupyterCollaborationProvider({
  path: 'notebook.ipynb',
  serverSettings: mySettings,
});
```

## Troubleshooting

- **Build fails**: Run `npm run type-check`
- **Lint errors**: Run `npm run lint:fix`
- **Node version**: Use Node 20+ (`nvm use`)
- **Collaboration issues**: Check WebSocket connections and jupyter-collaboration installation

## Development Tips

- Use npm, not yarn
- Prefer editing over creating files
- Run checks after changes: `npm run check:fix`
