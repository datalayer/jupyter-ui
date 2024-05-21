/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from "react";
import { CodeOrSourceMdx } from "@storybook/addon-docs";
import { Mermaid } from "mdx-mermaid/lib/Mermaid"
import mermaid from 'mermaid';
import zenuml from '@mermaid-js/mermaid-zenuml';
import type { Preview } from '@storybook/react';
import { toolbarTypes, withThemeProvider } from '../stories/_utils/story-helpers';

import '@jupyterlab/apputils/style/materialcolors.css';
import '@jupyterlab/application/style/buttons.css';
import '@jupyterlab/ui-components/style/base.css';
import '@jupyterlab/apputils/style/dialog.css';

import './custom.css';

export const globalTypes = toolbarTypes;
export const decorators = [withThemeProvider];

const init = mermaid.registerExternalDiagrams([zenuml]);

const preview: Preview = {
  parameters: {
    docs: {
      components: {
        code: props => {
          return props.className?.includes("mermaid")
            ? 
              <Mermaid chart={props.children} />
            :
              <CodeOrSourceMdx {...props} />
        }
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    html: {
      root: '#html-addon-root',
      removeEmptyComments: true,
    },
    controls: {
      expanded: true,
      hideNoControlsWarning: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    /*
    options: {
      storySort: (a, b) => {
        return (a.id === b.id ? 0 : a.id.localeCompare(b.id, undefined, { numeric: true }))
      }
    },
    */
    options: {
      storySort: {
          method: 'alphabetical',
          order: [ 'About', '*'],
          locales: 'en-US',
      }
    },
  },
};

export default preview;
