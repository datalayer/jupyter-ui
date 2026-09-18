/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');

const shimJS = path.resolve(__dirname, 'src', 'emptyshim.js');

function shim(regExp) {
  return new webpack.NormalModuleReplacementPlugin(regExp, shimJS);
}

const IS_PRODUCTION = process.argv.indexOf('--mode=production') > -1;
let mode = 'development';
if (IS_PRODUCTION) {
  mode = 'production';
}

let devtool = 'inline-source-map';
if (IS_PRODUCTION) {
  devtool = false;
}

let minimize = false;
if (IS_PRODUCTION) {
  minimize = true;
}

/*
 * The Loom recorder's React 18.
 *
 * `@loomhq/record-sdk` peers on React 18, imports it from the host and mounts
 * through `ReactDOM.render`, which React 19 removed; these examples run 19.
 * So the SDK, and everything it imports however deep, joins a layer of its
 * own, `loom18`, where `react` and `react-dom` mean the pair installed in
 * `vendor/react18` (`npm run install:react18`). Libraries it shares with the
 * page — @emotion and the rest — get instances of their own there, bound to
 * 18; the page's stay on 19. Without the pair the layer is left out and a
 * Loom block says why it cannot record. `vite.config.ts` does the same.
 */
const REACT_18 = path.resolve(__dirname, 'vendor', 'react18', 'node_modules');
const HAS_REACT_18 = fs.existsSync(
  path.join(REACT_18, 'react-dom', 'package.json'),
);
const LOOM_18_RESOLVE = {
  alias: {
    react: path.join(REACT_18, 'react'),
    'react-dom': path.join(REACT_18, 'react-dom'),
  },
};
const LOOM_18_RULES = HAS_REACT_18
  ? [
      {
        test: /[\\/]node_modules[\\/]@loomhq[\\/]record-sdk[\\/]/,
        layer: 'loom18',
        resolve: LOOM_18_RESOLVE,
      },
      { issuerLayer: 'loom18', layer: 'loom18', resolve: LOOM_18_RESOLVE },
    ]
  : [];

/*
 * Loom's public app id: from the shell's environment, or from `.env.local`,
 * which git ignores (a bare `.env` it does not, so the id does not go there).
 */
const LOOM_PUBLIC_APP_ID = (() => {
  if (process.env.LOOM_PUBLIC_APP_ID) {
    return process.env.LOOM_PUBLIC_APP_ID;
  }
  const file = path.join(__dirname, '.env.local');
  const line = fs.existsSync(file)
    ? /^\s*LOOM_PUBLIC_APP_ID\s*=\s*(.*?)\s*$/m.exec(
        fs.readFileSync(file, 'utf8'),
      )
    : null;
  return line ? line[1].replace(/^(['"])(.*)\1$/, '$2') : '';
})();

module.exports = {
  entry: ['./src/examples/index'],
  mode: mode,
  target: ['web', 'es2022'],
  watchOptions: {
    aggregateTimeout: 300,
    poll: 5000, // Seems to stabilise HMR file change detection.
    ignored: '/node_modules/',
  },
  devServer: {
    port: 3211,
    historyApiFallback: true,
    hot: !IS_PRODUCTION,
    client: {
      overlay: false,
    },
  },
  devtool,
  optimization: {
    minimize,
  },
  experiments: {
    topLevelAwait: true,
    asyncWebAssembly: true,
    // The Loom recorder's React 18 island: see LOOM_18_RULES.
    layers: true,
  },
  output: {
    publicPath: 'http://localhost:3211/',
    filename: '[name].jupyter-lexical.js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', 'jsx', '.js'],
    alias: {
      stream: 'stream-browserify',
    },
    fallback: {
      assert: require.resolve('assert/'),
    },
  },
  module: {
    rules: [
      ...LOOM_18_RULES,
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
        options: {
          plugins: ['@babel/plugin-proposal-class-properties'],
          presets: [
            [
              '@babel/preset-react',
              {
                runtime: 'automatic',
                importSource: 'react',
              },
            ],
            '@babel/preset-typescript',
          ],
          cacheDirectory: true,
        },
        exclude: /node_modules/,
      },
      {
        resourceQuery: /raw/,
        type: 'asset/source',
      },
      // just keep the woff2 fonts from fontawesome
      {
        test: /fontawesome-free.*\.(svg|eot|ttf|woff)$/,
        loader: 'ignore-loader',
      },
      {
        test: /\.(jpe?g|png|gif|ico|eot|ttf|map|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        resourceQuery: { not: [/raw/] },
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      { test: /\.md$/, use: 'raw-loader' },
      { test: /\.js.map$/, use: 'file-loader' },
      /*
      {
        // In .css files, svg is loaded as a data URI.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.css$/,
        use: {
          loader: 'svg-url-loader',
          options: { encoding: 'none', limit: 10000 },
        },
      },
      */
      {
        // In .ts and .tsx files (both of which compile to .js), svg files
        // must be loaded as a raw string instead of data URIs.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.js$/,
        type: 'asset/source',
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.c?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      // Special webpack rule for the JupyterLab theme style sheets.
      {
        test: /style\/theme\.css$/i,
        loader: 'css-loader',
        options: { exportType: 'string' },
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
      // WebAssembly files (loro-crdt)
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
    ],
  },
  plugins: [
    shim(/@fortawesome/),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    // Loom's public app id, for recording in a Loom block. From the
    // environment only: this repository is public and keeps no key.
    new webpack.DefinePlugin({
      'process.env.LOOM_PUBLIC_APP_ID': JSON.stringify(LOOM_PUBLIC_APP_ID),
    }),
    new HtmlWebpackPlugin({
      title: 'Jupyter Lexical',
      template: 'public/index.html',
    }),
    new HtmlWebpackTagsPlugin({
      links: [
        'https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
      ],
      tags: [
        //        'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js'
      ],
      append: false,
      publicPath: false,
    }),
  ],
};
