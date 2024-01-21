/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

const webpack = require("webpack");

import { LoadContext, Plugin } from '@docusaurus/types';
import { PluginOptions } from './types';
import { Configuration, ProvidePlugin } from 'webpack';

import path from 'path';

export default function (
  _context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: 'docusaurus-plugin-jupyter',
    getThemePath() {
      return path.resolve(__dirname, './theme');
    },
    configureWebpack(_config: Configuration, isServer: boolean) {
      return {
        mergeStrategy: {
          'resolve': 'prepend',
          'module.rules': 'prepend',
          'plugins': 'prepend',
        },
        resolve: {
          extensions: [ '.tsx', '.ts', 'jsx', '.js' ],
          alias: { 
            "stream": "stream-browserify",
          },
          fallback: { 
            "assert": require.resolve("assert/"),
          }
        },
        module: {
          rules: [
            {
              test: /\.m?js/,
              resolve: {
                  fullySpecified: false
              }
            },
            // Ship the JupyterLite service worker.
            {
              resourceQuery: /text/,
              type: 'asset/resource',
              generator: {
                filename: '[name][ext]',
              },
            },
            // Rule for pyodide kernel
            {
              test: /pypi\/.*/,
              type: 'asset/resource',
              generator: {
                filename: 'pypi/[name][ext][query]',
              },
            },
            {
              test: /pyodide-kernel-extension\/schema\/.*/,
              type: 'asset/resource',
              generator: {
                filename: 'schema/[name][ext][query]',
              },
            },
          ],
        },
        plugins: [
          new webpack.DefinePlugin({
//            'process.env': '{}',
//            'process.cwd': '() => "/"',
//            'process.argv': 'undefined'
          }),
          new webpack.ProvidePlugin({
            process: 'process/browser',
          }),
        ]
      };
    },
  };
}
