import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette, IToolbarWidgetRegistry, ISessionContextDialogs } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILauncher } from '@jupyterlab/launcher';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { ITranslator } from '@jupyterlab/translation';
import { reactIcon } from '@jupyterlab/ui-components';
import { requestAPI } from './handler';
import { JupyterReactWidget } from './widget';
import notebookClassicPlugin from './notebook/classic';
import { NotebookHeaderExtension } from './notebook/header';

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
  requires: [ICommandPalette, IRenderMimeRegistry, NotebookPanel.IContentFactory, IEditorServices, IToolbarWidgetRegistry, ITranslator],
  optional: [ISettingRegistry, ISessionContextDialogs, ILauncher],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    rendermime: IRenderMimeRegistry,
    contentFactory: NotebookPanel.IContentFactory,
    editorServices: IEditorServices,
    toolbarRegistry: IToolbarWidgetRegistry,
    translator: ITranslator,
    settingRegistry: ISettingRegistry | null,
    sessionContextDialogs_: ISessionContextDialogs | null,
    launcher: ILauncher | null
  ) => {

    const { commands } = app;
    const command = CommandIDs.create;
    commands.addCommand(command, {
      caption: 'Show Jupyter React',
      label: 'Jupyter React',
      icon: (args: any) => reactIcon,
      execute: () => {
        const content = new JupyterReactWidget();
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
        rank: 99,
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

    console.log('JupyterLab extension @datalayer/jupyter-react is activated!');

    app.docRegistry.addWidgetExtension('Notebook', new NotebookHeaderExtension());

  }
}

const plugins = [
  jupyterReactPlugin,
  notebookClassicPlugin,
]

export default plugins;
