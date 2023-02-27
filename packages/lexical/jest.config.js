/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

const func = require('@jupyterlab/testutils/lib/jest-config');
const jlabConfig = func(__dirname);

const esModules = [
  '@codemirror',
  '@jupyterlab',
  '@jupyter',
  'lib0',
  'nanoid',
  'vscode\\-ws\\-jsonrpc',
  'y\\-protocols',
  'y\\-websocket',
  'yjs'
].join('|');

const {
  moduleFileExtensions,
  moduleNameMapper,
  preset,
  setupFilesAfterEnv,
  setupFiles,
  testPathIgnorePatterns,
  transform
} = jlabConfig;

module.exports = {
/*
  ...jlabConfig,
  moduleFileExtensions,
  moduleNameMapper,
  preset,
  setupFilesAfterEnv,
  setupFiles,
  testPathIgnorePatterns,
  transform,
  automock: false,
*/
//  collectCoverageFrom: [
//    'src/**/*.{ts,tsx}',
//    '!src/**/*.d.ts',
//    '!src/**/.ipynb_checkpoints/*'
//  ],
/*
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
*/
  testRegex: '(/src/__tests__/.*|(\\./src)(test|spec))\\.[jt]sx?$',
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`],
  preset: "jest-puppeteer",
}
