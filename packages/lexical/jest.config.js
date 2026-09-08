/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * How this package's tests run.
 *
 * They are mostly about the parts of the package that are data rather than
 * editor — block conversion, tool schemas, the Excalidraw scene model — and
 * an agent loads those where there is no page, so Node is the default
 * environment. A test that needs a browser says so at the top of the file
 * with `@jest-environment jsdom`, and `jest.setup.js` fills in the DOM APIs
 * Lumino and CodeMirror reach for at import time.
 *
 * `ts-jest` compiles from `src`, so a test reads the source rather than a
 * build. `isolatedModules` because nothing here needs cross-file type
 * information at transform time, and it is much faster.
 */
const esModules = [
  '@codemirror',
  '@toon-format',
  '@jupyterlab',
  '@jupyter',
  // Reached through @jupyterlab/ui-components' form controls, which anything
  // touching the notebook stack pulls in transitively.
  '@microsoft',
  'exenv-es6',
  'lib0',
  'nanoid',
  'vscode\\-ws\\-jsonrpc',
  'y\\-protocols',
  'y\\-websocket',
  'yjs',
].join('|');

module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          isolatedModules: true,
          module: 'commonjs',
          target: 'es2020',
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
        },
      },
    ],
    /*
     * The packages above ship ESM only. Jest loads CommonJS, so they have to
     * be transformed rather than ignored — and that needs a transform that
     * matches `.mjs` as well as `.js`, or the file is handed to Node verbatim
     * and dies on its first `export`.
     */
    '^.+\\.m?jsx?$': [
      'babel-jest',
      { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] },
    ],
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`],
  // Applied to every test; a no-op for the ones that run in Node.
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Stylesheets and binary assets are not what any of these tests are about.
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|woff2?|png|jpe?g|svg)$':
      '@jupyterlab/testing/lib/jest-file-mock.js',
  },
};
