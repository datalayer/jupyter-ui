/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Preview } from '@storybook/react';
import { toolbarTypes, withThemeProvider } from '../stories/story-helpers';

import './custom.css';

import '@jupyterlab/apputils/style/materialcolors.css';
import '@jupyterlab/application/style/buttons.css';
import '@jupyterlab/ui-components/style/base.css';
import '@jupyterlab/apputils/style/dialog.css';

export const globalTypes = toolbarTypes;
export const decorators = [withThemeProvider];

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    html: {
      root: '#html-addon-root',
      removeEmptyComments: true,
    },
    controls: {
      hideNoControlsWarning: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
