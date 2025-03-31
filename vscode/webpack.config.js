/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const miniSVGDataURI = require('mini-svg-data-uri');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log', // enables logging required for problem matchers
  },
};

const webviewConfig = {
  target: 'web',
  mode: 'none',
  // Use inline source map to ease debug of webview
  // Xref. https://github.com/microsoft/vscode/issues/145292#issuecomment-1072879043
  devtool: 'inline-source-map',
  entry: './webview/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webview.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.svg'],
    fallback: {
      process: require.resolve('process/browser'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.join(__dirname, 'tsconfig.webview.json'),
            experimentalWatchApi: true,
            // transpileOnly enables hot-module-replacement
            transpileOnly: true,
          },
        },
      },
      { test: /\.raw\.css$/, type: 'asset/source' },
      {
        test: /(?<!\.raw)\.css$/,
        use: [require.resolve('style-loader'), require.resolve('css-loader')],
      },
      {
        test: /\.(jpe?g|png|gif|ico|eot|ttf|map|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: 'asset/resource',
      },
      {
        // In .css files, svg is loaded as a data URI.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.css$/,
        type: 'asset',
        generator: {
          dataUrl: content => miniSVGDataURI(content.toString()),
        },
      },
      {
        // In .ts and .tsx files (both of which compile to .js), svg files
        // must be loaded as a raw string instead of data URIs.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.js$/,
        type: 'asset/source',
      },
      {
        test: /\.(c|m)?js/,
        resolve: {
          fullySpecified: false,
        },
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
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
};

module.exports = [extensionConfig, webviewConfig];
