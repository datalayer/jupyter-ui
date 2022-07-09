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
          ],
        },
        plugins: [
          new webpack.DefinePlugin({
            'process.env': '{}',
            'process.cwd': '() => "/"',
            'process.argv': 'undefined'
          }),
          new webpack.ProvidePlugin({
            process: 'process/browser',
          }),
        ]
      };
    },
  };
}
