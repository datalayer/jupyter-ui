/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

const webpack = require('webpack');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@jupyterlab/settingregistry', '@jupyterlite/settings'],
  webpack: (config: any, options: any) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    // Fix json5 import issue for JupyterLab packages
    config.resolve.alias = {
      ...config.resolve.alias,
      'json5': require.resolve('json5/lib/index.js'),
      // Handle ~ prefix in CSS imports (JupyterLab style convention)
      '~react-toastify': 'react-toastify',
      '~@lumino': '@lumino',
      '~@jupyterlab': '@jupyterlab',
    };
    // Add a plugin to strip `~` from import paths (for JS imports)
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^~(.*)/,
        (resource: any) => {
          resource.request = resource.request.replace(/^~/, '');
        },
      ),
    );    
    config.module.rules.push(
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
      // Rule for Python wheel files
      {
        test: /\.whl$/,
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
    )
    return config
  },
}

module.exports = nextConfig;
