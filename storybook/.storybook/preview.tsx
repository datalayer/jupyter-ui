/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { Mermaid } from 'mdx-mermaid/lib/Mermaid';
import mermaid from 'mermaid';
import zenuml from '@mermaid-js/mermaid-zenuml';
import type { Preview } from '@storybook/react';
import {
  toolbarTypes,
  withThemeProvider,
} from '../src/stories/_utils/story-helpers';

import '@jupyterlab/apputils/style/materialcolors.css';
import '@jupyterlab/application/style/buttons.css';
import '@jupyterlab/ui-components/style/base.css';
import '@jupyterlab/apputils/style/dialog.css';

// JupyterLab core styles
import '@jupyterlab/apputils/style/index.js';
import '@jupyterlab/rendermime/style/index.js';
import '@jupyterlab/codeeditor/style/index.js';
import '@jupyterlab/cells/style/index.js';
import '@jupyterlab/documentsearch/style/index.js';
import '@jupyterlab/outputarea/style/index.js';
import '@jupyterlab/console/style/index.js';
import '@jupyterlab/completer/style/index.js';
import '@jupyterlab/codemirror/style/index.js';
import '@jupyterlab/notebook/style/index.js';
import '@jupyterlab/filebrowser/style/index.js';
import '@jupyterlab/terminal/style/index.js';
import '@jupyterlab/ui-components/style/index.js';

// ipywidgets styles
import '@jupyter-widgets/base/css/index.css';
import '@jupyter-widgets/controls/css/widgets-base.css';

// JupyterLab theme (light by default)
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

// Jupyter Lexical styles (import individual files to avoid Tailwind processing requirement)
import '@datalayer/jupyter-lexical/style/base.css';
import '@datalayer/jupyter-lexical/style/lexical/Button.css';
import '@datalayer/jupyter-lexical/style/lexical/CodeActionMenuPlugin.css';
import '@datalayer/jupyter-lexical/style/lexical/CommentEditorTheme.css';
import '@datalayer/jupyter-lexical/style/lexical/CommentPlugin.css';
import '@datalayer/jupyter-lexical/style/lexical/ContentEditable.css';
import '@datalayer/jupyter-lexical/style/lexical/Dialog.css';
import '@datalayer/jupyter-lexical/style/lexical/DraggableBlockPlugin.css';
import '@datalayer/jupyter-lexical/style/lexical/Editor.css';
import '@datalayer/jupyter-lexical/style/lexical/EquationEditor.css';
import '@datalayer/jupyter-lexical/style/lexical/FloatingTextFormatToolbarPlugin.css';
import '@datalayer/jupyter-lexical/style/lexical/FontSize.css';
import '@datalayer/jupyter-lexical/style/lexical/ImageNode.css';
import '@datalayer/jupyter-lexical/style/lexical/Input.css';
import '@datalayer/jupyter-lexical/style/lexical/Jupyter.css';
import '@datalayer/jupyter-lexical/style/lexical/KatexEquationAlterer.css';
import '@datalayer/jupyter-lexical/style/lexical/Modal.css';
import '@datalayer/jupyter-lexical/style/lexical/Placeholder.css';
import '@datalayer/jupyter-lexical/style/lexical/PrettierButton.css';
import '@datalayer/jupyter-lexical/style/lexical/Rich.css';
import '@datalayer/jupyter-lexical/style/lexical/TableOfContentsPlugin.css';
import '@datalayer/jupyter-lexical/style/lexical/Theme.css';
import '@datalayer/jupyter-lexical/style/lexical/ToolbarPlugin.css';

import './custom.css';

export const globalTypes = toolbarTypes;
export const decorators = [withThemeProvider];

const init = mermaid.registerExternalDiagrams([zenuml]);

const preview: Preview = {
  parameters: {
    docs: {
      autodocs: true,
      components: {
        code: (props: { className?: string; children?: React.ReactNode }) => {
          return props.className?.includes('mermaid') ? (
            <Mermaid chart={props.children as string} />
          ) : (
            <code {...props} />
          );
        },
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
        order: ['Welcome', '*'],
        locales: 'en-US',
      },
    },
  },
};

export default preview;
