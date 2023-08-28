import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { IViewerTracker } from './token';
import { Viewer, ViewerFactory } from './ViewerDocument';
import ViewerButton from './ViewerButton';

export namespace CommandIDs {
  export const viewerRender = 'notebook:render-with-viewer';
  export const viewerOpen = 'notebook:open-with-viewer';
}

export const VIEWER_WIDGET_FACTORY = 'Viewer';

const viewerPlugin: JupyterFrontEndPlugin<IViewerTracker> = {
  id: '@datalayer/jupyter-dashboard:viewer',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette, ILayoutRestorer, IMainMenu, ISettingRegistry],
  provides: IViewerTracker,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette | null,
    restorer: ILayoutRestorer | null,
    menu: IMainMenu | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    const { commands, docRegistry } = app;
    const viewerTracker = new WidgetTracker<Viewer>({
      namespace: 'viewer'
    });
    if (restorer) {
      restorer.restore(viewerTracker, {
        command: 'docmanager:open',
        args: panel => ({
          path: panel.context.path,
          factory: viwerRenderFactory.name
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
    const viwerRenderFactory = new ViewerFactory({
      name: VIEWER_WIDGET_FACTORY,
      fileTypes: ['notebook'],
      modelName: 'notebook',
    });
    viwerRenderFactory.widgetCreated.connect((sender, viewer) => {
      viewer.context.pathChanged.connect(() => {
        void viewerTracker.save(viewer);
      });
      void viewerTracker.add(viewer);
    });
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      viwerRenderFactory.defaultRenderOnSave = settings.get('renderOnSave')
        .composite as boolean;
    };
    if (settingRegistry) {
      Promise.all([settingRegistry.load(viewerPlugin.id), app.restored])
        .then(([settings]) => {
          updateSettings(settings);
          settings.changed.connect(updateSettings);    
        })
        .catch((reason: Error) => {
          console.error(reason.message);
        });
    }
    commands.addCommand(CommandIDs.viewerRender, {
      label: 'Viewer',
      execute: async args => {
        const notebookPanel = getCurrentNotebookPanel(args);
        let context: DocumentRegistry.IContext<INotebookModel>;
        if (notebookPanel) {
          context = notebookPanel.context;
          await context.save();
          commands.execute('docmanager:open', {
            path: context.path,
            factory: VIEWER_WIDGET_FACTORY,
            options: {
              mode: 'split-right'
            }
          });
        }
      },
      isEnabled
    });
    commands.addCommand(CommandIDs.viewerOpen, {
      label: 'Open with Dashboard',
      execute: async args => {
        const notebookPanel = getCurrentNotebookPanel(args);
        if (!notebookPanel) {
          return;
        }
        await notebookPanel.context.save();
      },
      isEnabled
    });
    if (palette) {
      const category = 'Notebook Operations';
      [CommandIDs.viewerRender, CommandIDs.viewerOpen].forEach(command => {
        palette.addItem({ command, category });
      });
    }
    if (menu) {
      menu.viewMenu.addGroup(
        [
          {
            command: CommandIDs.viewerRender
          },
          {
            command: CommandIDs.viewerOpen
          }
        ],
        1000
      );
    }
    const viewerButton = new ViewerButton(commands);

    docRegistry.addWidgetFactory(viwerRenderFactory);
    docRegistry.addWidgetExtension('Notebook', viewerButton);

    return viewerTracker;
  }

}

export default viewerPlugin;
