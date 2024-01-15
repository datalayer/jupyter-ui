/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { listIcon } from '@jupyterlab/ui-components';
import { addJupyterLabThemeChangeListener } from '@jupyter/web-components';
import { VariableInspectionHandler } from './handler';
import { Languages } from './inspectorscripts';
import { KernelConnector } from './kernelconnector';
import { VariableInspectorManager } from './manager';
import { VariableInspectorPanel } from './widget';
import Kernel from './../../../jupyter/kernel/Kernel';

import './variablesinspector.css';

addJupyterLabThemeChangeListener();

export const createVariablesInspectorManager = () => {
  const manager = new VariableInspectorManager();
  function createVariableInspectorPanel(): VariableInspectorPanel {
    const panel = new VariableInspectorPanel();
    panel.id = 'jp-variableinspector';
    panel.title.label = 'Variable Inspector';
    panel.title.icon = listIcon;
    panel.title.closable = true;
    panel.disposed.connect(() => {
      if (manager.panel === panel) {
        manager.panel = undefined;
      }
    });
    return panel;
  }
  manager.panel = createVariableInspectorPanel();
  manager.source?.performInspection();
  return manager;
};

export const registerKernel = (
  manager: VariableInspectorManager,
  kernel: Kernel,
) => {
  const handlers: { [id: string]: Promise<VariableInspectionHandler> } = {};

  /**
   * Subscribes to the creation of new notebooks. If a new notebook is created, build a new handler for the notebook.
   * Adds a promise for a instanced handler to the 'handlers' collection.
   */
  // A promise that resolves after the initialization of the handler is done.
  handlers[kernel.id] = new Promise((resolve, reject) => {
    const connector = new KernelConnector({ kernel });

    const scripts: Promise<Languages.LanguageModel> = connector.ready.then(
      async () => {
        const lang = await connector.kernelLanguage;
        return Languages.getScript(lang);
      },
    );

    scripts
      .then((result: Languages.LanguageModel) => {
        const initScript = result.initScript;
        const queryCommand = result.queryCommand;
        const matrixQueryCommand = result.matrixQueryCommand;
        const widgetQueryCommand = result.widgetQueryCommand;
        const deleteCommand = result.deleteCommand;
        const options: VariableInspectionHandler.IOptions = {
          queryCommand: queryCommand,
          matrixQueryCommand: matrixQueryCommand,
          widgetQueryCommand,
          deleteCommand: deleteCommand,
          connector: connector,
          initScript: initScript,
          id: kernel.path, //Using the sessions path as an identifier for now.
        };

        const handler = new VariableInspectionHandler(options);

        manager.addHandler(handler);

        kernel.connection?.disposed.connect(() => {
          delete handlers[kernel.id];
          handler.dispose();
        });

        handler.ready.then(() => {
          const future = handlers[kernel.id];
          future?.then((source: VariableInspectionHandler) => {
            if (source) {
              manager.source = source;
              manager.source.performInspection();
            }
          });
          resolve(handler);
        });
      })
      .catch((result: string) => {
        reject(result);
      });
  });
};
