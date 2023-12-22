import type { StorybookConfig } from '@storybook/react-webpack5';

import { join, dirname } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    {
      name: getAbsolutePath('@storybook/addon-essentials'),
      options: {
        backgrounds: false,
      },
    },
    getAbsolutePath('@storybook/addon-interactions'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  webpackFinal: config => {
    config.module?.rules?.push({
      test: /\.tsx?$/,
      loader: "babel-loader",
      options: {
        plugins: [
          [
            '@babel/plugin-transform-typescript',
            {
              allowDeclareFields: true,
            },
          ],
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
    })
    return config;
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
