/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

module.exports = {
  sourceMap: 'inline',
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};
