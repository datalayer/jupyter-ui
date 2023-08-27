import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILauncher } from '@jupyterlab/launcher';
import icon from '@datalayer/icons-react/data2/AtomSymbolIconLabIcon';
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
  optional: [ISettingRegistry, ILauncher],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry?: ISettingRegistry,
    launcher?: ILauncher,
  ) => {
    const { commands } = app;
    const command = CommandIDs.create;
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
      }
    });
    const category = 'Jupyter React';
    palette.addItem({ command, category, args: { origin: 'from palette' } });
    if (launcher) {
      launcher.add({
        command,
        category: 'Datalayer',
        rank: 4,
      });
    }
    if (settingRegistry) {
      settingRegistry
        .load(jupyterReactPlugin.id)
        .then(settings => {
          console.log('@datalayer/jupyter-react settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for @datalayer/jupyter-react.', reason);
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
      }
    );
    console.log('JupyterLab plugin @datalayer/jupyter-react is activated.');
  }
}

const plugins = [
  jupyterReactPlugin,
  notebookContentFactoryPlugin,
]

export default plugins;
