/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, options) => {
    // https://github.com/vercel/next.js/issues/34501#issuecomment-1046655345
    // 'filename' is specific to 'asset/resource' type only, but incompatible with 'asset/inline',
    // see https://webpack.js.org/guides/asset-modules/#custom-output-filename.
    // Here we rename generator['asset'] into generator['asset/resource'] to avoid conflicts with inline assets.
    /*
    if (config.module.generator?.asset?.filename) {
      if (!config.module.generator['asset/resource']) {
        config.module.generator['asset/resource'] = config.module.generator.asset
      }
      delete config.module.generator.asset
    }
    */
    config.module.rules.push(
      // TODO Fix this @see https://github.com/datalayer/jupyter-ui/issues/104#issuecomment-1906371673
      // We must escape the JupyterLab theme style sheets to apply specific rules
      // this is only needed in stand-alone mode
      /*
      { 
        test: /(?<!style\/theme)\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // Special webpack rule for the JupyterLab theme style sheets.
      {
        test: /style\/theme\.css$/i,
        loader: 'css-loader',
        options: { exportType: 'string' },
      },
      */
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
    )
    return config
  },
}

module.exports = nextConfig
