/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import type { Preview } from "@storybook/react";
import { toolbarTypes, withThemeProvider } from "../stories/story-helpers";

import '@jupyterlab/apputils/style/materialcolors.css';
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/application/style/buttons.css';
import '@jupyterlab/ui-components/style/styling.css';
import '@jupyterlab/apputils/style/dialog.css';

export const globalTypes = toolbarTypes
export const decorators = [withThemeProvider]


const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
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
