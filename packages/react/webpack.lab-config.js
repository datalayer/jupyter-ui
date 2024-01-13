/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

module.exports = {
  module: {
    rules: [
      // Rule to deal with the service-worker.ts file
      // It will include the transpiled file as a text file named `[name][ext]`
      // That file is available from the static folder of this extension. That
      // requires to overwrite the `workerUrl` in '@datalayer/jupyter-kernels:browser-service-worker'
      // see https://github.com/jupyterlite/jupyterlite/blob/1a1bbcaab83f3c56fde6747a8c9b83d3c2a9eb97/packages/server/src/tokens.ts#L5
      {
        resourceQuery: /text/,
        type: 'asset/resource',
        generator: {
          // Must match the filename in jupyter_kernels/handlers/service_worker/handler.py
          filename: 'lite-[name][ext]',
        },
      },
      // Rules for pyodide kernel assets
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
};
