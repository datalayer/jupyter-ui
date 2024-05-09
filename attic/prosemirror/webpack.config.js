/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

const webpack = require("webpack");

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');

const IS_PRODUCTION = process.argv.indexOf('--mode=production') > -1;
let mode = "development";
if (IS_PRODUCTION) {
  mode = "production";
}

let devtool = "inline-source-map";
if (IS_PRODUCTION) {
  devtool = false;
}

let minimize = false;
if (IS_PRODUCTION) {
  minimize = true;
}

const JUPYTER_HOST = 'http://localhost:8686';
// const JUPYTER_HOST = 'http://minikube.local';

module.exports = {
  entry: ['./src/adapter/Example'],
  mode: mode,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 2000, // Seems to stabilise HMR file change detection.
    ignored: "/node_modules/"
  },
  devServer: {
    port: 4567,
    proxy: {
      '/api/jupyter-kernels': {
        target: JUPYTER_HOST,
        ws: true,
        secure: false,
        changeOrigin: true,
//        proxyTimeout: 1000 * 60 * 10,
//        timeout: 1000 * 60 * 10,
      },
      '/plotly.js': {
        target: JUPYTER_HOST + '/api/jupyter-kernels/pool/react',
        ws: false,
        secure: false,
        changeOrigin: true,
//        proxyTimeout: 1000 * 60 * 10,
//        timeout: 1000 * 60 * 10,
      },
    },
  },
  devtool: devtool,
  optimization: {
    minimize: minimize,
  },
  output: {
    publicPath: "http://localhost:4567/",
    filename: '[name].[contenthash].jupyterProsemirror.js',
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
        test: /\.tsx?$/,
        loader: "babel-loader",
        options: {
          plugins: [
            "@babel/plugin-proposal-class-properties",
          ],
          presets: [
            ["@babel/preset-react", {
                runtime: 'automatic',
                importSource: 'react'
              },
            ],
            "@babel/preset-typescript",
          ],
          cacheDirectory: true
        },
        exclude: /node_modules/,
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.md$/, use: 'raw-loader' },
      { test: /\.js.map$/, use: 'file-loader' },
      {
        // In .css files, svg is loaded as a data URI.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        oneOf: [
          {
            // In css files, svg is loaded as a url formatted string.
            issuer: /\.css$/ ,
            use: {
              loader: 'svg-url-loader',
              options: { encoding: 'none', limit: 10000 }
            }
          },
          {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            issuer: /\.tsx$/,
            use: [
              '@svgr/webpack'
            ],
          },
          {
            // In js, jsx, ts, and tsx files svg is loaded as a raw string.
            issuer: /\.(js|jsx|ts|tsx)$/,
            use: {
              loader: 'raw-loader'
            }
          }
        ]
      },
      {
        // In .ts and .tsx files (both of which compile to .js), svg files
        // must be loaded as a raw string instead of data URIs.
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        issuer: /\.js$/,
        use: {
          loader: 'raw-loader'
        }
      },
      {
        test: /\.(png|jpg|gif|ttf|woff|woff2|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [{ loader: 'url-loader', options: { limit: 10000 } }]
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.c?js/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new HtmlWebpackPlugin({
      title: 'Jupyter UI',
      template : 'public/index.html'
    }),
    new HtmlWebpackTagsPlugin({
      links: [
        '//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
      ],
      tags: [
        'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js'
      ],
      append: false, 
      publicPath: false
    }),
  ]
};
