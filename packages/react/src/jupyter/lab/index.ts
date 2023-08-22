import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILauncher } from '@jupyterlab/launcher';
import { reactIcon } from '@jupyterlab/ui-components';
import { requestAPI } from './handler';
import { JupyterReactWidget } from './widget';
import { NotebookHeaderExtension } from './notebook/header/NotebookHeader';
import notebookClassicPlugin from './notebook/classic/plugin';
import dashboardPlugin from './notebook/dashboard/plugin';
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
      icon: (args: any) => reactIcon,
      execute: () => {
        const content = new JupyterReactWidget(app);
        const widget = new MainAreaWidget<JupyterReactWidget>({ content });
        widget.title.label = 'Jupyter React';
        widget.title.icon = reactIcon;
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
    requestAPI<any>('get_config')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The Jupyter Server jupyter_react extension appears to be missing.\n${reason}`
        );
      }
    );
    app.docRegistry.addWidgetExtension('Notebook', new NotebookHeaderExtension(commands));
    console.log('JupyterLab extension @datalayer/jupyter-react is activated.');
  }
}

const plugins = [
  jupyterReactPlugin,
  notebookClassicPlugin,
  dashboardPlugin,
  notebookContentFactoryPlugin,
]

export default plugins;
