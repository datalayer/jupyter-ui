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
import { ClassicRender, INotebookRenderTracker, ClassicRenderFactory } from './classic';
import { notebookClassicIcon } from './icons';

export namespace CommandIDs {
  export const classicRender = 'notebook:render-with-classic';
  export const classicOpen = 'notebook:open-with-classic';
}

const WIDGET_FACTORY = 'Classic Render';

class NotebookPreviewButton implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private _commands: CommandRegistry;

  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      className: 'classicRender',
      tooltip: 'Render with Classic',
      icon: notebookClassicIcon,
      onClick: () => { this._commands.execute(CommandIDs.classicRender); }
    });
    panel.toolbar.insertAfter('cellType', 'classicRender', button);
    return button;
  }

}

/**
 * Initialization data for the jupyterlab-preview extension.
 */
const notebookClassicPlugin: JupyterFrontEndPlugin<INotebookRenderTracker> = {
  id: '@datalayer/jupyter-react:classic',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette, ILayoutRestorer, IMainMenu, ISettingRegistry],
  provides: INotebookRenderTracker,
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
          factory: classicFactory.name
        }),
        name: panel => panel.context.path,
        when: app.serviceManager.ready
      });
    }
    function getCurrent(args: ReadonlyPartialJSONObject): NotebookPanel | null {
      const widget = notebookTracker.currentWidget;
      const activate = args['activate'] !== false;
      if (activate && widget) {
        app.shell.activateById(widget.id);
      }
      return widget;
    }
    function isEnabled(): boolean {
      return (
        notebookTracker.currentWidget !== null &&
        notebookTracker.currentWidget === app.shell.currentWidget
      );
    }
    function getPreviewUrl(path: string): string {
      const baseUrl = PageConfig.getBaseUrl();
      return `${baseUrl}tree/${path}`;
    }
    const classicFactory = new ClassicRenderFactory(getPreviewUrl, {
      name: WIDGET_FACTORY,
      fileTypes: ['notebook'],
      modelName: 'notebook'
    });
    classicFactory.widgetCreated.connect((sender, widget) => {
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      void tracker.add(widget);
    });
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      classicFactory.defaultRenderOnSave = settings.get('renderOnSave')
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
        const current = getCurrent(args);
        let context: DocumentRegistry.IContext<INotebookModel>;
        if (current) {
          context = current.context;
          await context.save();
          commands.execute('docmanager:open', {
            path: context.path,
            factory: WIDGET_FACTORY,
            options: {
              mode: 'split-right'
            }
          });
        }
      },
      isEnabled
    });
    commands.addCommand(CommandIDs.classicOpen, {
      label: 'Open with Classic in New Browser Tab',
      execute: async args => {
        const current = getCurrent(args);
        if (!current) {
          return;
        }
        await current.context.save();
        const previewUrl = getPreviewUrl(current.context.path);
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
    const classicRenderButton = new NotebookPreviewButton(commands);
    //
    docRegistry.addWidgetExtension('Notebook', classicRenderButton);
    docRegistry.addWidgetFactory(classicFactory);
    //
    return tracker;
  }

}

export default notebookClassicPlugin;
