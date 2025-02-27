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
  // './src/examples/Bokeh';
  // './src/examples/Bqplot';
  // './src/examples/Cell';
  // './src/examples/CellLite';
  // './src/examples/Cells';
  // './src/examples/CellsExecute';
  // './src/examples/Console';
  // './src/examples/ConsoleLite';
  // './src/examples/Deno';
  // './src/examples/FileBrowser';
  // './src/examples/IPyLeaflet';
  // './src/examples/IPyReact';
  // './src/examples/IPyWidgets';
  // './src/examples/IPyWidgetsState';
  // './src/examples/JupyterContext';
  // './src/examples/JupyterLabApp';
  // './src/examples/JupyterLabAppHeadless';
  // './src/examples/JupyterLabAppHeadlessServerless';
  // './src/examples/JupyterLabAppServerless';
  // './src/examples/JupyterLabAppServiceManager';
  // './src/examples/KernelExecute';
  // './src/examples/KernelExecutor';
  // './src/examples/Kernels';
  // './src/examples/Lumino';
  // './src/examples/Matplotlib';
  './src/examples/Notebook';
  // './src/examples/NotebookCellSidebar';
  // './src/examples/NotebookCellToolbar';
  // './src/examples/NotebookColorMode';
  // './src/examples/NotebookCollaborative';
  // './src/examples/NotebookExtension';
  // './src/examples/NotebookKernelChange';
  // './src/examples/NotebookLess';
  // './src/examples/NotebookLite';
  // './src/examples/NotebookLiteContext';
  // './src/examples/NotebookLocalServer';
  // './src/examples/NotebookMutationsKernel';
  // './src/examples/NotebookMutationsServiceManager';
  // './src/examples/NotebookNbformat';
  // './src/examples/NotebookNbformatChange';
  // './src/examples/NotebookNoContext';
  // './src/examples/NotebookNoPrimer';
  // './src/examples/NotebookOnSessionConnection';
  // './src/examples/NotebookPathChange';
  // './src/examples/NotebookReadonly';
  // './src/examples/NotebookServiceManager';
  // './src/examples/NotebookSimple';
  // './src/examples/NotebookSkeleton';
  // './src/examples/NotebookTheme';
  // './src/examples/NotebookThemeColormode';
  // './src/examples/NotebookURL';
  // './src/examples/NotebookURL';
  // './src/examples/ObservableHQ';
  // './src/examples/Output';
  // './src/examples/OutputWithMonitoring';
  // './src/examples/Outputs';
  // './src/examples/Plotly';
  // './src/examples/PyGWalker';
  // './src/examples/RunningSessions';
  // './src/examples/Terminal';
  // './src/examples/Viewer';

const IS_JUPYTER_SERVER_LOCAL = process.env.LOCAL_JUPYTER_SERVER == 'true';
const IS_NO_CONFIG = process.env.NO_CONFIG == 'true';
const INDEX_PAGE = IS_JUPYTER_SERVER_LOCAL ?
    'index-local.html'
  : 
    IS_NO_CONFIG ?
       'index-noconfig.html'
    :
      'index.html';
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
    client: {
      overlay: false,
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
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
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
      // We must escape the JupyterLab theme style sheets to apply specific rules
      // this is only needed in stand-alone mode
      { test: /(?<!style\/theme)\.css$/, use: ['style-loader', 'css-loader'] },
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
      ],
      append: false,
      publicPath: false,
    }),
  ],
};
