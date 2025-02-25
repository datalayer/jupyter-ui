/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { CountdownPromptContentFactory } from './CountdownContentFactory';

/**
 * The notebook cell factory provider.
 */
export const contentFactoryPlugin: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> =
  {
    id: '@datalayer/jupyter-react:notebook-content-factory',
    description: 'Provides the notebook cell factory.',
    provides: NotebookPanel.IContentFactory,
    requires: [IEditorServices],
    autoStart: true,
    activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
      const editorFactory = editorServices.factoryService.newInlineEditor;
      return new CountdownPromptContentFactory({ editorFactory });
    },
  };

export default contentFactoryPlugin;
