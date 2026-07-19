/*
 * Copyright (c) 2021-Present Datalayer, Inc.
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
