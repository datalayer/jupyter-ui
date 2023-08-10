import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker, ToolbarButton } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import dashboardIcon from '@datalayer/icons-react/data1/AcademicCapIconLabIcon';
import { Dashboard, IDashboardTracker, DashboardFactory } from './dashboard';

export namespace CommandIDs {
  export const dashboardRender = 'notebook:render-with-dashboard';
  export const dashboardOpen = 'notebook:open-with-dashboard';
}

export const DASHBOARD_WIDGET_FACTORY = 'Dashboard Preview';

class DashboardButton implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private _commands: CommandRegistry;

  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      className: 'dashboardRender',
      tooltip: 'Dashboard',
      icon: dashboardIcon as any,
      onClick: () => { this._commands.execute(CommandIDs.dashboardRender); }
    });
    panel.toolbar.insertAfter('cellType', 'dashboardRender', button);
    return button;
  }

}

/**
 * Initialization data for the jupyterlab-preview extension.
 */
const dashboardPlugin: JupyterFrontEndPlugin<IDashboardTracker> = {
  id: '@datalayer/jupyter-react:dashboard',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette, ILayoutRestorer, IMainMenu, ISettingRegistry],
  provides: IDashboardTracker,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette | null,
    restorer: ILayoutRestorer | null,
    menu: IMainMenu | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    const { commands, docRegistry } = app;
    const tracker = new WidgetTracker<Dashboard>({
      namespace: 'dashboard-preview'
    });
    if (restorer) {
      restorer.restore(tracker, {
        command: 'docmanager:open',
        args: panel => ({
          path: panel.context.path,
          factory: dashboardRenderFactory.name
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
    const dashboardRenderFactory = new DashboardFactory({
      name: DASHBOARD_WIDGET_FACTORY,
      fileTypes: ['notebook'],
      modelName: 'notebook',
    });
    dashboardRenderFactory.widgetCreated.connect((sender, dashboard) => {
      dashboard.context.pathChanged.connect(() => {
        void tracker.save(dashboard);
      });
      void tracker.add(dashboard);
    });
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      dashboardRenderFactory.defaultRenderOnSave = settings.get('renderOnSave')
        .composite as boolean;
    };
    if (settingRegistry) {
      Promise.all([settingRegistry.load(dashboardPlugin.id), app.restored])
        .then(([settings]) => {
          updateSettings(settings);
          settings.changed.connect(updateSettings);    
        })
        .catch((reason: Error) => {
          console.error(reason.message);
        });
    }
    commands.addCommand(CommandIDs.dashboardRender, {
      label: 'Dashboard',
      execute: async args => {
        const notebookPanel = getCurrentNotebookPanel(args);
        let context: DocumentRegistry.IContext<INotebookModel>;
        if (notebookPanel) {
          context = notebookPanel.context;
          await context.save();
          commands.execute('docmanager:open', {
            path: context.path,
            factory: DASHBOARD_WIDGET_FACTORY,
            options: {
              mode: 'split-right'
            }
          });
        }
      },
      isEnabled
    });
    commands.addCommand(CommandIDs.dashboardOpen, {
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
      [CommandIDs.dashboardRender, CommandIDs.dashboardOpen].forEach(command => {
        palette.addItem({ command, category });
      });
    }
    if (menu) {
      menu.viewMenu.addGroup(
        [
          {
            command: CommandIDs.dashboardRender
          },
          {
            command: CommandIDs.dashboardOpen
          }
        ],
        1000
      );
    }
    const dashboardRenderButton = new DashboardButton(commands);
    //
    docRegistry.addWidgetFactory(dashboardRenderFactory);
    docRegistry.addWidgetExtension('Notebook', dashboardRenderButton);
    //
    return tracker;
  }

}

export default dashboardPlugin;
