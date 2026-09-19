# AGENTS.md

Guidance for coding agents working in this repository.

## Overview

React components for Jupyter — notebooks, cells, consoles, outputs, terminals,
file browsers — usable outside JupyterLab. An npm workspaces monorepo run with
Lerna. Use npm, not yarn. Node >= 20 (`nvm use` reads `.nvmrc`).

| Path                         | What it is                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `packages/react`             | `@datalayer/jupyter-react`, the components                                    |
| `packages/lexical`           | `@datalayer/jupyter-lexical`, a Lexical editor with Jupyter cells and outputs |
| `packages/embed`             | `@datalayer/jupyter-embed`, the components in any web page                    |
| `packages/docusaurus-plugin` | `@datalayer/jupyter-docusaurus-plugin`                                        |
| `storybook/`                 | the Storybook                                                                 |
| `examples/`                  | Vite, Docusaurus and Lexical example apps                                     |
| `docs/`                      | the documentation site                                                        |

## Commands

```bash
npm install && npm run build

npm run jupyter:server        # local Jupyter server, port 8686
npm run storybook             # Storybook, port 6006
npm run jupyter:ui:vite       # also :docusaurus, :lexical

# in packages/react — the examples, on port 3208
npm run start                 # against the public Datalayer OSS server
npm run start-local           # against the local server (starts it too)

npm test                      # every package's tests
npm run check                 # format check, lint, type-check
npm run check:fix             # format, lint --fix, type-check
```

Run `npm run check:fix` after changes.

## Key facts

- **Which example runs:** `ENTRY` in `packages/react/entries.js`, shared by
  webpack and Vite. The default, `./src/examples/Examples`, picks one at runtime.
- **Local server:** `dev/config/jupyter_server_config.py`. Its token is the
  public demo token
  `60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6`, which
  `packages/react/public/index-local.html` also carries.
- **Collaboration:** the dev config already sets `c.LabApp.collaborative = True`.
  It needs `pip install jupyter-collaboration`; then open http://localhost:3208/
  in two windows. In code:

  ```tsx
  const provider = new JupyterCollaborationProvider();
  <Notebook collaborationProvider={provider} path="notebook.ipynb" />;
  ```

- **Keep `@datalayer/jupyter-react` free of platform styling.** Consumers such as
  the VS Code extension override its CSS and pass callbacks, e.g.
  `KernelActionMenu`'s `onClearOutputs`.
- **Dependency direction:** `jupyter-lexical` depends on `jupyter-react`, never
  the reverse. Code that only needs notebooks imports `jupyter-react` alone, so
  Lexical stays out of its bundle.
