/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';
import { ISessionContextDialogs, IToolbarWidgetRegistry } from '@jupyterlab/apputils';
import { NotebookPanel, NotebookWidgetFactory, INotebookWidgetFactory, StaticNotebook } from '@jupyterlab/notebook';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { PageConfig } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';

/**
 * The name of the factory that creates notebooks.
 */
const FACTORY = 'Datalayer Notebook';

/**
 * Activate the notebook widget factory.
 */
function activateWidgetFactory(
  app: JupyterFrontEnd,
  contentFactory: NotebookPanel.IContentFactory,
  editorServices: IEditorServices,
  rendermime: IRenderMimeRegistry,
  toolbarRegistry: IToolbarWidgetRegistry,
  settingRegistry: ISettingRegistry | null,
  sessionContextDialogs_: ISessionContextDialogs | null,
  translator_: ITranslator | null
): NotebookWidgetFactory.IFactory {
  const translator = translator_ ?? nullTranslator;
  const preferKernelOption = PageConfig.getOption('notebookStartsKernel');
  // If the option is not set, assume `true`
  const preferKernelValue = preferKernelOption === '' || preferKernelOption.toLowerCase() === 'true';
  const trans = translator.load('jupyterlab');
  const factory = new NotebookWidgetFactory({
    name: FACTORY,
    label: trans.__('Datalayer Notebook'),
    fileTypes: ['notebook'],
    modelName: 'notebook',
    defaultFor: ['notebook'],
    preferKernel: preferKernelValue,
    canStartKernel: true,
    rendermime,
    contentFactory,
    editorConfig: StaticNotebook.defaultEditorConfig,
    notebookConfig: StaticNotebook.defaultNotebookConfig,
    mimeTypeService: editorServices.mimeTypeService,
    translator
  });
  app.docRegistry.addWidgetFactory(factory);
  return factory;
}

/**
 * The notebook widget factory provider.
 */
export const widgetFactoryPlugin: JupyterFrontEndPlugin<NotebookWidgetFactory.IFactory> =
  {
    id: '@datalayer/notebook-extension:widget-factory',
    description: 'Provides the notebook widget factory.',
    provides: INotebookWidgetFactory,
    requires: [
      NotebookPanel.IContentFactory,
      IEditorServices,
      IRenderMimeRegistry,
      IToolbarWidgetRegistry
    ],
    optional: [ISettingRegistry, ISessionContextDialogs, ITranslator],
    activate: activateWidgetFactory,
    autoStart: true
  };


export default widgetFactoryPlugin;
