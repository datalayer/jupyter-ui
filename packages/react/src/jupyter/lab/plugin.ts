/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';
import {
  MainAreaWidget,
  ICommandPalette,
  WidgetTracker,
} from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ServerConnection } from '@jupyterlab/services';
import icon from '@datalayer/icons-react/data2/AtomSymbolIconJupyterLab';
import { requestAPI } from './../JupyterHandlers';
import { JupyterReactWidget } from './widget';
import notebookContentFactoryPlugin from './notebook/content/plugin';

import '../../../style/index.css';

/**
 * The command IDs used by the plugin.
 */
namespace CommandIDs {
  export const create = 'create-jupyter-react-widget';
}

/**
 * Initialization data for the @datalayer/jupyter-react extension.
 */
const jupyterReactPlugin: JupyterFrontEndPlugin<void> = {
  id: '@datalayer/jupyter-react:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ISettingRegistry, ILauncher, ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry?: ISettingRegistry,
    launcher?: ILauncher,
    restorer?: ILayoutRestorer
  ) => {
    const { commands } = app;
    const command = CommandIDs.create;
    const tracker = new WidgetTracker<MainAreaWidget<JupyterReactWidget>>({
      namespace: 'jupyter-react',
    });
    if (restorer) {
      void restorer.restore(tracker, {
        command,
        name: () => 'jupyter-react',
      });
    }
    commands.addCommand(command, {
      caption: 'Show Jupyter React',
      label: 'Jupyter React',
      icon,
      execute: () => {
        const content = new JupyterReactWidget(app);
        const widget = new MainAreaWidget<JupyterReactWidget>({ content });
        widget.title.label = 'Jupyter React';
        widget.title.icon = icon;
        app.shell.add(widget, 'main');
        tracker.add(widget);
      },
    });
    const category = 'Datalayer';
    palette.addItem({ command, category, args: { origin: 'from palette' } });
    if (launcher) {
      launcher.add({
        command,
        category,
        rank: 2.4,
      });
    }
    const settingsUpdated = (settings: ISettingRegistry.ISettings) => {
      const showInLauncher = settings.get('showInLauncher')
        .composite as boolean;
      if (launcher && showInLauncher) {
        launcher.add({
          command,
          category,
          rank: 2.4,
        });
      }
    };
    if (settingRegistry) {
      settingRegistry
        .load(jupyterReactPlugin.id)
        .then(settings => {
          console.log(
            '@datalayer/jupyter-react settings loaded:',
            settings.composite
          );
          settingsUpdated(settings);
          settings.changed.connect(settingsUpdated);
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for @datalayer/jupyter-react.',
            reason
          );
        });
    }
    requestAPI<any>(ServerConnection.makeSettings(), 'jupyter_react', 'config')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The Jupyter Server jupyter_react extension extension.\n${reason}`
        );
      });
    console.log('JupyterLab plugin @datalayer/jupyter-react is activated.');
  },
};

export default [
  jupyterReactPlugin,
  notebookContentFactoryPlugin
];
