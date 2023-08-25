import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { reactIcon } from '@jupyterlab/ui-components';
import { Token } from '@lumino/coreutils';
import { DatalayerWidget } from './widget';
import { requestAPI } from './handler';
import { connect } from './ws';
import { timer, Timer, TimerView, ITimerViewProps } from "./store";

import '../style/index.css';

export type IJupytertraitlets = {
  timer: Timer,
  TimerView: (props: ITimerViewProps) => JSX.Element,
};

export const IJupytertraitlets = new Token<IJupytertraitlets>(
  '@datalayer/jupyter-traitlets:plugin'
);

export const jupytertraitlets: IJupytertraitlets = {
  timer,
  TimerView,
}

/**
 * The command IDs used by the jupyter-traitlets-widget plugin.
 */
namespace CommandIDs {
  export const create = 'create-jupyter-traitlets-widget';
}

/**
 * Initialization data for the @datalayer/jupyter-traitlets extension.
 */
const plugin: JupyterFrontEndPlugin<IJupytertraitlets> = {
  id: '@datalayer/jupyter-traitlets:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ISettingRegistry, ILauncher],
  provides: IJupytertraitlets,
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry | null,
    launcher: ILauncher
  ): IJupytertraitlets => {
    const { commands } = app;
    const command = CommandIDs.create;
    commands.addCommand(command, {
      caption: 'Show Jupyter Traitlets',
      label: 'Jupyter Traitlets',
      icon: (args: any) => reactIcon,
      execute: () => {
        const content = new DatalayerWidget();
        const widget = new MainAreaWidget<DatalayerWidget>({ content });
        widget.title.label = 'Jupyter Traitlets';
        widget.title.icon = reactIcon;
        app.shell.add(widget, 'main');
      }
    });
    const category = 'Jupyter Traitlets';
    palette.addItem({ command, category, args: { origin: 'from palette' } });
    if (launcher) {
      launcher.add({
        command,
        category: 'Datalayer',
        rank: 4,
      });
    }
    console.log('JupyterLab extension @datalayer/jupyter-traitlets is activated!');
    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('@datalayer/jupyter-traitlets settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for @datalayer/jupyter-traitlets.', reason);
        });
    }
    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyter_traitlets server extension extension.\n${reason}`
        );
      });
    connect('ws://localhost:8888/jupyter_traitlets/echo', true);
    return jupytertraitlets;
  }
};

export default plugin;
