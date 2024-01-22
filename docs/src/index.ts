/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

const webpack = require("webpack");

import { LoadContext, Plugin } from '@docusaurus/types';
import { PluginOptions } from './types';

import path from 'path';

export default function (
  _context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: 'docusaurus-plugin-jupyter',
    getThemePath() {
      return path.resolve(__dirname, './theme');
    },
  };
}
