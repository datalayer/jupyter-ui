/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {replaceCodePlugin} from 'vite-plugin-replace';
import babel from '@rollup/plugin-babel';
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    replaceCodePlugin({
      replacements: [
        {
          from: /__DEV__/g,
          to: 'true',
        },
      ],
    }),
    babel({
      babelHelpers: 'bundled',
      babelrc: false,
      configFile: false,
      exclude: '/**/node_modules/**',
      extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
      plugins: [
        '@babel/plugin-transform-flow-strip-types',
      ],
      presets: ['@babel/preset-react'],
    }),
    react(),
  ],
  resolve: {
    alias: 
    {
      // https://github.com/facebook/lexical/issues/2153
      yjs: path.resolve('./../../node_modules/yjs/src/index.js'),
      '~@lumino': '@lumino',
      '~@fortawesome': '@fortawesome',
      '~@jupyterlab': '@jupyterlab',
      '~xterm': 'xterm',
    },
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        main: new URL('./public/index.html', import.meta.url).pathname,
      },
    },
  },
});
