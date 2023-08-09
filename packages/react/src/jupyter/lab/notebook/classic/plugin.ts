import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker, ToolbarButton } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { ClassicRender, IClassicRenderTracker, ClassicRenderFactory } from './classicRender';
import { jupiterIconLabIcon as notebookClassicIcon } from '@datalayer/icons-react/data2/JupiterIconLabIcon';

export namespace CommandIDs {
  export const classicRender = 'notebook:render-with-classic';
  export const classicOpen = 'notebook:open-with-classic';
}

export const CLASSIC_RENDER_WIDGET_FACTORY = 'Classic Render';

class ClassicRenderButton implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private _commands: CommandRegistry;

  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      className: 'classicRender',
      tooltip: 'Render with Classic',
      icon: notebookClassicIcon as any,
      onClick: () => { this._commands.execute(CommandIDs.classicRender); }
    });
    panel.toolbar.insertAfter('cellType', 'classicRender', button);
    return button;
  }

}

/**
 * Initialization data for the jupyterlab-preview extension.
 */
const notebookClassicPlugin: JupyterFrontEndPlugin<IClassicRenderTracker> = {
  id: '@datalayer/jupyter-react:classic',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette, ILayoutRestorer, IMainMenu, ISettingRegistry],
  provides: IClassicRenderTracker,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette | null,
    restorer: ILayoutRestorer | null,
    menu: IMainMenu | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    const { commands, docRegistry } = app;
    const tracker = new WidgetTracker<ClassicRender>({
      namespace: 'classic-preview'
    });
    if (restorer) {
      restorer.restore(tracker, {
        command: 'docmanager:open',
        args: panel => ({
          path: panel.context.path,
          factory: classicRenderFactory.name
        }),
        name: panel => panel.context.path,
        when: app.serviceManager.ready
      });
    }
    function getCurrentNotebookPanel(args: ReadonlyPartialJSONObject): NotebookPanel | null {
      const notebookPanel = notebookTracker.currentWidget;
      const activate = args['activate'] !== false;
      if (activate && notebookPanel) {
        app.shell.activateById(notebookPanel.id);
      }
      return notebookPanel;
    }
    function isEnabled(): boolean {
      return (
        notebookTracker.currentWidget !== null &&
        notebookTracker.currentWidget === app.shell.currentWidget
      );
    }
    function getClassicUrl(path: string): string {
      const baseUrl = PageConfig.getBaseUrl();
      return `${baseUrl}tree/${path}`;
    }
    const classicRenderFactory = new ClassicRenderFactory(getClassicUrl, {
      name: CLASSIC_RENDER_WIDGET_FACTORY,
      fileTypes: ['notebook'],
      modelName: 'notebook'
    });
    classicRenderFactory.widgetCreated.connect((sender, classicRender) => {
      classicRender.context.pathChanged.connect(() => {
        void tracker.save(classicRender);
      });
      void tracker.add(classicRender);
    });
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      classicRenderFactory.defaultRenderOnSave = settings.get('renderOnSave')
        .composite as boolean;
    };
    if (settingRegistry) {
      Promise.all([settingRegistry.load(notebookClassicPlugin.id), app.restored])
        .then(([settings]) => {
          updateSettings(settings);
          settings.changed.connect(updateSettings);    
        })
        .catch((reason: Error) => {
          console.error(reason.message);
        });
    }
    commands.addCommand(CommandIDs.classicRender, {
      label: 'Render Notebook with Classic',
      execute: async args => {
        const notebookPanel = getCurrentNotebookPanel(args);
        let context: DocumentRegistry.IContext<INotebookModel>;
        if (notebookPanel) {
          context = notebookPanel.context;
          await context.save();
          commands.execute('docmanager:open', {
            path: context.path,
            factory: CLASSIC_RENDER_WIDGET_FACTORY,
            options: {
              mode: 'split-right'
            }
          });
        }
      },
      isEnabled
    });
    commands.addCommand(CommandIDs.classicOpen, {
      label: 'Render with Classic',
      execute: async args => {
        const notebookPanel = getCurrentNotebookPanel(args);
        if (!notebookPanel) {
          return;
        }
        await notebookPanel.context.save();
        const previewUrl = getClassicUrl(notebookPanel.context.path);
        window.open(previewUrl);
      },
      isEnabled
    });
    if (palette) {
      const category = 'Notebook Operations';
      [CommandIDs.classicRender, CommandIDs.classicOpen].forEach(command => {
        palette.addItem({ command, category });
      });
    }
    if (menu) {
      menu.viewMenu.addGroup(
        [
          {
            command: CommandIDs.classicRender
          },
          {
            command: CommandIDs.classicOpen
          }
        ],
        1000
      );
    }
    const classicRenderButton = new ClassicRenderButton(commands);
    //
    docRegistry.addWidgetFactory(classicRenderFactory);
    docRegistry.addWidgetExtension('Notebook', classicRenderButton);
    //
    return tracker;
  }

}

export default notebookClassicPlugin;
