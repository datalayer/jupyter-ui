/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * Datalayer License
 */

import React from "react";
import { CodeOrSourceMdx } from "@storybook/addon-docs";
import { Mermaid } from "mdx-mermaid/lib/Mermaid"
import mermaid from 'mermaid';
import zenuml from '@mermaid-js/mermaid-zenuml';
import type { Preview } from '@storybook/react';
import { toolbarTypes, withThemeProvider } from '../src/stories/_utils/story-helpers';

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
          order: [
            'Welcome', 'Open Science Cases', 'Options for a Platform', 'Platforms in a Quadrant', 'Plan your Platform', 'For the Edge', 'A Data Scientist Journey',
            'IAM', ['Personal Account', 'Join', 'Login',  'Profile', 'Organizations', 'Teams', 'Enterprises', 'Vault', 'Token', 'New Password', 'New Password Confirm', 'IAM Provider' ],
            'Subscriptions', [ 'Tiers', 'Activity' , 'Credits' , 'Billing' , 'Support' ],
            'Notebooks', [ 'Notebook Editor', 'IPyWidgets', 'Mime Renderers', 'Autocomplete', 'Dataframe Explorer', 'Variables Explorer', 'Snippets', 'Rich Editor', 'Table of Content', 'Export', 'Extensions' ],
            'Kernels', [ 'Remote Kernel', 'Server Kernel', 'Browser Kernel' ],
            'Environments', [ 'Base Kernel', 'Custom Libraries', 'Requests and Limits', 'GPU' ],
            'Contents', [ 'Local File System', 'S3 Bucket', 'Git Repositories', 'Integrations' ],
            'Spaces', [ 'Contents', 'Environments', 'Kernels', 'Notebooks', 'Access Control', 'Search' ],
            'Collaboration', [ 'Rooms', 'Notebook', 'Kernel', 'Versioning', 'Comments', 'Suggestions', 'Access Control' ],
            'Deployments', [ 'Notebook', 'Functions', 'Panel Applications', 'Solara Applications', 'Streamlit Applications', 'Access Control' ],
            'AI', [ 'AI Assistant' ],
            'Automation', [ 'Scheduler' ],
            'Management', [ 'Observability', 'Status', 'Limits', 'Logs', 'Alerting', 'Backup', 'Restore', 'Integrations'  ],
            'Components', ['About', '*'],
          ],
          locales: 'en-US',
      }
    },
  },
};

export default preview;
