/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');

const shimJS = path.resolve(__dirname, 'src', 'emptyshim.js');

function shim(regExp) {
  return new webpack.NormalModuleReplacementPlugin(regExp, shimJS);
}

const ENTRY =
  // './src/app/App';
  // './src/examples/Cell';
  // './src/examples/Console';
  // './src/examples/IPyLeaflet';
  // './src/examples/IPyReact';
  // './src/examples/IPyWidgets';
  // './src/examples/IPyWidgetsWithState';
  // './src/examples/JupyterLabApp';
  // './src/examples/JupyterLabHeadlessApp';
  // './src/examples/KernelExecutor';
  // './src/examples/Lumino';
  // './src/examples/Matplotlib';
  // './src/examples/Notebook';
  './src/examples/NotebookColorMode';
  // './src/examples/NotebookKernelChange';
  // './src/examples/NotebookModel';
  // './src/examples/NotebookModelChange';
  // './src/examples/NotebookTheme';
  // './src/examples/Outputs';
  // './src/examples/RunningSessions';
  // './src/examples/Terminal';
  // './src/examples/Viewer';

const IS_JUPYTER_SERVER_LOCAL = process.env.LOCAL_JUPYTER_SERVER == 'true';
// const JUPYTER_HOST = IS_JUPYTER_SERVER_LOCAL ? "http://localhost:8686" : "https://oss.datalayer.tech';
const INDEX_PAGE = IS_JUPYTER_SERVER_LOCAL ? 'index-local.html' : 'index.html';
const IS_PRODUCTION = process.argv.indexOf('--mode=production') > -1;
const mode = IS_PRODUCTION ? 'production' : 'development';
const devtool = IS_PRODUCTION ? false : 'inline-source-map';
const minimize = IS_PRODUCTION ? true : false;
const publicPath = IS_PRODUCTION
  ? '/static/jupyter_react/'
  : 'http://localhost:3208/';

module.exports = {
  entry: [ENTRY],
  mode: mode,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 2000, // Seems to stabilise HMR file change detection.
    ignored: '/node_modules/',
  },
  devServer: {
    port: 3208,
    historyApiFallback: true,
    hot: !IS_PRODUCTION,
    https: false,
    server: 'http',
    proxy: {
      /*
      '/api': {
        target: JUPYTER_HOST,
        pathRewrite: { '^/api': '/api/jupyter/api' },
        ws: true,
        secure: true,
        changeOrigin: true,
      },
      */
      '/build/pypi': {
        target: 'https://datalayer-assets.s3.us-west-2.amazonaws.com/pypi',
        pathRewrite: { '^/build/pypi': '' },
        ws: false,
        secure: false,
        changeOrigin: true,
      },
      '/services.js': {
        target:
          'https://datalayer-assets.s3.us-west-2.amazonaws.com/services.js',
        pathRewrite: { '^/services.js': '' },
        ws: false,
        secure: false,
        changeOrigin: true,
      },
      '/plotly.js': {
        target: 'https://cdn.plot.ly',
        pathRewrite: { '^/plotly.js': 'plotly-2.25.2.min.js' },
        ws: false,
        secure: false,
        changeOrigin: true,
      },
    },
  },
  devtool,
  optimization: {
    minimize,
  },
  output: {
    publicPath,
    filename: '[name].jupyter-react.js',
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
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
        options: {
          plugins: [
            [
              '@babel/plugin-transform-typescript',
              {
                allowDeclareFields: true,
              },
            ],
            '@babel/plugin-proposal-class-properties',
          ],
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
        test: /pypi\/.*/,
        type: 'asset/resource',
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
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.md$/, type: 'asset/source' },
      { test: /\.js.map$/, type: 'asset/resource' },
      {
        // In .css files, svg is loaded as a data URI.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.css$/,
        use: {
          loader: 'svg-url-loader',
          options: { encoding: 'none', limit: 10000 },
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
    ],
  },
  plugins: [
    shim(/@fortawesome/),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new HtmlWebpackPlugin({
      title: 'Jupyter React',
      template: 'public/' + INDEX_PAGE,
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
