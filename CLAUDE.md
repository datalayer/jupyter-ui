# Jupyter UI - AI Assistant Guide

## Quick Overview

React component library for Jupyter notebooks. Monorepo with 4 packages managed by Lerna.

## Core Packages

- `@datalayer/jupyter-react` - React components for notebooks, cells, terminals
- `@datalayer/jupyter-lexical` - Rich text editor integration
- `@datalayer/jupyter-docusaurus-plugin` - Docusaurus plugin
- `datalayer-jupyter-vscode` - VS Code extension

## Essential Commands

```bash
npm install                   # Install dependencies
npm run build                 # Build all packages
npm run jupyter:server        # Start Jupyter server (port 8686)
npm run storybook            # Start Storybook (port 6006)
npm run lint                 # Check errors only (--quiet)
npm run lint:fix             # Auto-fix issues
npm run format               # Format code
npm run type-check           # TypeScript checking
npm run check                # Run all checks (format, lint, type)
npm run check:fix            # Auto-fix and check all
npm test                     # Run tests
```

## Requirements

- Node.js >= 20.0.0 (use .nvmrc)
- npm (not yarn)
- Server token: `60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6`

## Key Files

- `eslint.config.js` - ESLint v9 flat config
- `.prettierrc.json` - Formatter config
- `.prettierignore` - Excludes MDX files
- `patches/` - Third-party fixes (auto-applied)
- `packages/react/webpack.config.js` - Build config

## Recent Fixes (2024)

- MDX comments: `{/_` → `{/** **/}` in 13 files
- Node requirement: 18 → 20+
- Webpack warnings: 7 → 2 (source-map exclusions)
- @jupyterlite patch for missing logos
- ESLint v9 flat config migration
- React 18 deprecations fixed
- Storybook CI: Added wait-on and --url for test reliability
- Terminal component: Fixed BoxPanel initialization issue

## Common Issues

1. **Storybook errors**: Check MDX syntax, run `npx patch-package`
2. **Node version**: Use Node 20+ (`nvm use`)
3. **Lint errors**: Run `npm run lint:fix`
4. **Build fails**: Run `npm run type-check`

## AI Assistant Notes

- Always use npm, not yarn
- Prefer editing over creating files
- Run lint/type checks before committing
