import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { Widget, Menu } from '@lumino/widgets';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { WidgetTracker, showDialog, Dialog, InputDialog } from '@jupyterlab/apputils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { MainAreaWidget, ICommandPalette } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { CodeCell } from '@jupyterlab/cells';
import { INotebookTracker } from '@jupyterlab/notebook';
import { undoIcon, redoIcon, copyIcon, cutIcon, pasteIcon, runIcon, saveIcon } from '@jupyterlab/ui-components';
import { DashboardIcons } from './editor/icons';
import notebookHeaderPlugin from './notebook/header/plugin';
import classicRenderPlugin from './notebook/classic/plugin';
import viewerPlugin from './notebook/viewer/plugin';
import { Dashboard, DashboardDocumentFactory, DashboardTracker, IDashboardTracker } from './editor/dashboard';
import { DashboardWidget } from './editor/widget';
import { DashboardModel, DashboardModelFactory } from './editor/model';
import { CommandIDs } from './editor/commands';
import { DashboardLayout } from './editor/layout';
import { WidgetStore, WidgetInfo } from './editor/widgetStore';
import { getMetadata } from './editor/utils';
import { requestAPI } from './handler';
import { DashboardHomeWidget } from './widget';

import '../style/index.css';

const dashboardHomePlugin: JupyterFrontEndPlugin<void> = {
  id: '@datalayer/jupyter-dashboard:home',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ISettingRegistry, ILauncher],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry | null,
    launcher: ILauncher
  ) => {
    const { commands } = app;
    const command = CommandIDs.showDashboardHome;
    commands.addCommand(command, {
      caption: 'Show Dashboard',
      label: 'Dashboard',
      icon: DashboardIcons.dashboardGreen,
      execute: () => {
        const content = new DashboardHomeWidget();
        const widget = new MainAreaWidget<DashboardHomeWidget>({ content });
        widget.title.label = 'Dashboard';
        widget.title.icon = DashboardIcons.dashboardGreen;
        app.shell.add(widget, 'main');
      }
    });
    const category = 'Datalayer';
    palette.addItem({ command, category });
    if (launcher) {
      launcher.add({
        command,
        category,
        rank: 4
      });
    }
    console.log('JupyterLab plugin @datalayer/jupyter-dashboard:home is activated!');
    if (settingRegistry) {
      settingRegistry
        .load(dashboardHomePlugin.id)
        .then(settings => {
          console.log('@datalayer/jupyter-dashboard:home settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for @datalayer/juptyer-dashboard:home.', reason);
        });
    }
    requestAPI<any>('config')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `Error while accessing the jupyter server extension.\n${reason}`
        );
      });
  }
};

const dashboardTrackerPlugin: JupyterFrontEndPlugin<IDashboardTracker> = {
  id: '@datalayer/jupyter-dashboard:tracker',
  autoStart: true,
  requires: [INotebookTracker, IMainMenu, IDocumentManager, ILauncher],
  provides: IDashboardTracker,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    mainMenu: IMainMenu,
    docManager: IDocumentManager,
    launcher: ILauncher
  ): IDashboardTracker => {
    const dashboardTracker = new DashboardTracker({ namespace: 'dashboards' });
    const outputTracker = new WidgetTracker<DashboardWidget>({namespace: 'dashboard-outputs' });
    const clipboard = new Set<WidgetStore.WidgetInfo>();
    addCommands(
      app,
      dashboardTracker,
      outputTracker,
      clipboard,
      docManager,
      notebookTracker
    );
    const dashboardFiletype: Partial<DocumentRegistry.IFileType> = {
      name: 'dashboard',
      displayName: 'Jupyter Dashboard',
      contentType: 'file',
      extensions: [
        '.dash',
        '.dashboard',
      ],
      fileFormat: 'text',
      icon: DashboardIcons.dashboardGreen,
      iconLabel: 'Jupyter Dashboard',
      mimeTypes: ['application/json']
    };
    app.docRegistry.addFileType(dashboardFiletype);
    const modelFactory = new DashboardModelFactory({ notebookTracker });
    app.docRegistry.addModelFactory(modelFactory);
    const widgetFactory = new DashboardDocumentFactory({
      name: 'dashboard',
      modelName: 'dashboard',
      fileTypes: ['dashboard'],
      defaultFor: ['dashboard'],
      commandRegistry: app.commands,
      outputTracker
    });
    app.docRegistry.addWidgetFactory(widgetFactory);
    widgetFactory.widgetCreated.connect((_sender, widget) => {
      void dashboardTracker.add(widget.content);
      widget.title.icon = dashboardFiletype.icon;
      widget.title.iconClass = dashboardFiletype.iconClass || '';
      widget.title.iconLabel = dashboardFiletype.iconLabel || '';
      const model = widget.content.model;
      // TODO: Make scrollMode changable in JL. Default 'infinite' for now.
      model.scrollMode = 'infinite';
      model.width = Dashboard.DEFAULT_WIDTH;
      model.height = Dashboard.DEFAULT_HEIGHT;
    });
    app.contextMenu.addItem({
      command: CommandIDs.save,
      selector: '.dsh-JupyterDashboard',
      rank: 3
    });
    app.contextMenu.addItem({
      command: CommandIDs.undo,
      selector: '.dsh-JupyterDashboard',
      rank: 1
    });
    app.contextMenu.addItem({
      command: CommandIDs.redo,
      selector: '.dsh-JupyterDashboard',
      rank: 2
    });
    app.contextMenu.addItem({
      command: CommandIDs.cut,
      selector: '.dsh-JupyterDashboard',
      rank: 3
    });
    app.contextMenu.addItem({
      command: CommandIDs.copy,
      selector: '.dsh-JupyterDashboard',
      rank: 4
    });
    app.contextMenu.addItem({
      command: CommandIDs.paste,
      selector: '.dsh-JupyterDashboard',
      rank: 5
    });
    const experimentalMenu = new Menu({ commands: app.commands });
    experimentalMenu.title.label = 'Experimental';
    experimentalMenu.addItem({
      command: CommandIDs.saveToMetadata
    });
    experimentalMenu.addItem({
      command: CommandIDs.toggleInfiniteScroll
    });
    experimentalMenu.addItem({
      command: CommandIDs.trimDashboard
    });
    app.contextMenu.addItem({
      type: 'submenu',
      submenu: experimentalMenu,
      selector: '.dsh-JupyterDashboard',
      rank: 6
    });
    app.contextMenu.addItem({
      command: CommandIDs.deleteOutput,
      selector: '.dsh-EditableWidget',
      rank: 0
    });
    app.contextMenu.addItem({
      command: CommandIDs.toggleFitContent,
      selector: '.dsh-EditableWidget',
      rank: 1
    });
    app.contextMenu.addItem({
      command: CommandIDs.toggleWidgetMode,
      selector: '.dsh-EditableWidget',
      rank: 2
    });
    app.contextMenu.addItem({
      type: 'separator',
      selector: '.dsh-EditableWidget',
      rank: 3
    });
    app.contextMenu.addItem({
      command: CommandIDs.openFromMetadata,
      selector: '.jp-Notebook',
      rank: 16
    });
    app.commands.addKeyBinding({
      command: CommandIDs.deleteOutput,
      args: {},
      keys: ['Backspace'],
      selector: '.dsh-EditableWidget'
    });
    app.commands.addKeyBinding({
      command: CommandIDs.undo,
      args: {},
      keys: ['Z'],
      selector: '.dsh-JupyterDashboard'
    });
    app.commands.addKeyBinding({
      command: CommandIDs.redo,
      args: {},
      keys: ['Shift Z'],
      selector: '.dsh-JupyterDashboard'
    });
    app.commands.addKeyBinding({
      command: CommandIDs.cut,
      args: {},
      keys: ['Accel X'],
      selector: '.dsh-JupyterDashboard'
    });
    app.commands.addKeyBinding({
      command: CommandIDs.copy,
      args: {},
      keys: ['Accel C'],
      selector: '.dsh-JupyterDashboard'
    });
    app.commands.addKeyBinding({
      command: CommandIDs.paste,
      args: {},
      keys: ['Accel V'],
      selector: '.dsh-JupyterDashboard'
    });
    app.commands.addKeyBinding({
      command: CommandIDs.toggleFitContent,
      args: {},
      keys: ['K'],
      selector: '.dsh-EditableWidget'
    });
    mainMenu.fileMenu.addGroup([
      {
        command: CommandIDs.setDimensions
      },
      {
        command: CommandIDs.setTileSize
      }
    ]);
    mainMenu.fileMenu.newMenu.addGroup([
      {
        command: CommandIDs.createNew
      }
    ]);
    /*
    launcher.add({
      command: CommandIDs.createNew,
      category: 'Datalayer',
      rank: 5,
    });
    */
    return dashboardTracker;
  }
};

function addCommands(
  app: JupyterFrontEnd,
  dashboardTracker: WidgetTracker<Dashboard>,
  outputTracker: WidgetTracker<DashboardWidget>,
  clipboard: Set<WidgetStore.WidgetInfo>,
  docManager: IDocumentManager,
  notebookTracker: INotebookTracker
): void {
  const { commands } = app;
  /**
   * Whether there is an active dashboard.
   */
  function hasDashboard(): boolean {
    return dashboardTracker.currentWidget !== null;
  }
  /**
   * Whether there is a dashboard output.
   */
  function hasOutput(): boolean {
    return outputTracker.currentWidget !== null;
  }
  function inToolbar(args?: ReadonlyPartialJSONObject): boolean {
    return args ? args.toolbar as boolean : false;
  }
  /**
   * Deletes a selected DashboardWidget.
   */
  commands.addCommand(CommandIDs.deleteOutput, {
    label: 'Delete Output',
    execute: args => {
      const widget = outputTracker.currentWidget!;
      const dashboard = dashboardTracker.currentWidget!;
      dashboard.deleteWidget(widget);
    }
  });
  /**
   * Undo the last change to a dashboard.
   */
  commands.addCommand(CommandIDs.undo, {
    label: args => (inToolbar(args) ? '' : 'Undo'),
    icon: undoIcon,
    execute: args => {
      dashboardTracker.currentWidget?.undo();
    },
    isEnabled: args =>
      inToolbar(args)
  });
  /**
   * Redo the last undo to a dashboard.
   */
  commands.addCommand(CommandIDs.redo, {
    label: args => (inToolbar(args) ? '' : 'Redo'),
    icon: redoIcon,
    execute: args => {
      dashboardTracker.currentWidget?.redo();
    },
    isEnabled: args =>
      inToolbar(args)
  });
  commands.addCommand(CommandIDs.toggleFitContent, {
    label: args => 'Fit To Content',
    execute: args => {
      const widget = outputTracker.currentWidget;
      widget!.fitToContent = !widget!.fitToContent;
      if (widget!.fitToContent) {
        widget!.fitContent();
      }
    },
    isVisible: args => outputTracker.currentWidget?.mode === 'free-edit',
    isToggled: args => outputTracker.currentWidget?.fitToContent || false,
  });
  commands.addCommand(CommandIDs.toggleMode, {
    icon: args => {
      const mode = dashboardTracker.currentWidget?.model.mode || 'present';
      if (mode === 'present') {
        return DashboardIcons.edit;
      } else {
        return DashboardIcons.view;
      }
    },
    label: args => {
      if (inToolbar(args)) {
        return '';
      }
      const mode = dashboardTracker.currentWidget?.model.mode || 'present';
      if (mode === 'present') {
        return 'Switch To Edit Mode';
      } else {
        return 'Switch To Presentation Mode';
      }
    },
    execute: args => {
      const dashboard = dashboardTracker.currentWidget!;
      if (dashboard.model.mode === 'present') {
        dashboard.model.mode = 'free-edit';
      } else {
        dashboard.model.mode = 'present';
      }
    }
  });
  commands.addCommand(CommandIDs.runOutput, {
    label: args => (inToolbar(args) ? '' : 'Run Output'),
    icon: runIcon,
    execute: args => {
      const widget = outputTracker.currentWidget!;
      const sessionContext = widget.notebook.sessionContext;
      CodeCell.execute(widget.cell as CodeCell, sessionContext);
    }
  });
  commands.addCommand(CommandIDs.setDimensions, {
    label: 'Set Dashboard Dimensions',
    execute: async args => {
      const model = dashboardTracker.currentWidget?.model!;
      const width = model.width ? model.width : Dashboard.DEFAULT_WIDTH;
      const height = model.height ? model.height : Dashboard.DEFAULT_HEIGHT;
      await showDialog({
        title: 'Enter Dimensions',
        body: new Private.ResizeHandler(width, height),
        focusNodeSelector: 'input',
        buttons: [Dialog.cancelButton(), Dialog.okButton()]
      }).then(result => {
        const value = result.value;
        let newWidth = value![0];
        let newHeight = value![1];
        if (value === null && model.width && model.height) {
          return;
        }
        if (!newWidth) {
          if (!model.width) {
            newWidth = Dashboard.DEFAULT_WIDTH;
          } else {
            newWidth = model.width;
          }
        }
        if (!newHeight) {
          if (!model.height) {
            newHeight = Dashboard.DEFAULT_HEIGHT;
          } else {
            newHeight = model.height;
          }
        }
        model.width = newWidth;
        model.height = newHeight;
      });
    },
    isEnabled: hasDashboard
  });
  commands.addCommand(CommandIDs.setTileSize, {
    label: 'Set Grid Dimensions',
    execute: async args => {
      const newSize = await InputDialog.getNumber({
        title: 'Enter Grid Size'
      });
      if (newSize.value) {
        const layout = dashboardTracker.currentWidget?.layout as DashboardLayout;
        layout.setTileSize(newSize.value);
      }
    },
    isEnabled: hasDashboard
  });
  commands.addCommand(CommandIDs.copy, {
    label: args => (inToolbar(args) ? '' : 'Copy'),
    icon: copyIcon,
    execute: args => {
      const info = outputTracker.currentWidget?.info;
      clipboard.clear();
      clipboard.add(info!);
    },
    isEnabled: args => inToolbar(args) || hasOutput()
  });
  commands.addCommand(CommandIDs.cut, {
    label: args => (inToolbar(args) ? '' : 'Cut'),
    icon: cutIcon,
    execute: args => {
      const widget = outputTracker.currentWidget;
      const info = widget?.info;
      const dashboard = dashboardTracker.currentWidget;
      clipboard.clear();
      clipboard.add(info!);
      dashboard?.deleteWidget(widget!);
    },
    isEnabled: args => inToolbar(args) || hasOutput()
  });
  commands.addCommand(CommandIDs.paste, {
    label: args => (inToolbar(args) ? '' : 'Paste'),
    icon: pasteIcon,
    execute: args => {
      const id = args.dashboardId;
      let dashboard: Dashboard;
      if (id) {
        dashboard = dashboardTracker.find(widget => widget.id === id)!;
      } else {
        dashboard = dashboardTracker.currentWidget!;
      }
      const widgetStore = dashboard.model.widgetStore;
      clipboard.forEach(info => {
        const widgetId = DashboardWidget.createDashboardWidgetId();
        const pos = info.pos;
        pos.left = Math.max(pos.left - 10, 0);
        pos.top = Math.max(pos.top - 10, 0);

        const newWidget = widgetStore.createWidget({ ...info, widgetId, pos });
        dashboard.addWidget(newWidget, pos);
      });
    },
    isEnabled: args => inToolbar(args) || (hasOutput() && clipboard.size !== 0)
  });
  commands.addCommand(CommandIDs.saveToMetadata, {
    label: 'Save Dashboard To Notebook Metadata',
    execute: args => {
      const dashboard = dashboardTracker.currentWidget;
      dashboard?.saveToNotebookMetadata();
    }
  });
  commands.addCommand(CommandIDs.createNew, {
    label: 'Jupyter Dashboard',
    icon: DashboardIcons.dashboardGreen,
    execute: async args => {
      // A new file is created and opened separately to override the default
      // opening behavior when there's a notebook and open the dashboard in a
      // split pane instead of a tab.
      const notebook = notebookTracker.currentWidget;
      const newModel = await docManager.newUntitled({
        ext: 'dash',
        path: '/',
        type: 'file'
      });
      const path = newModel.path;
      if (notebook) {
        docManager.openOrReveal(`/${path}`, undefined, undefined, {
          mode: 'split-left',
          ref: notebook.id
        });
      } else {
        docManager.openOrReveal(`/${path}`);
      }
    }
  });
  // TODO: Make this optionally saveAs (based on filename?)
  commands.addCommand(CommandIDs.save, {
    label: args => (inToolbar(args) ? '' : 'Save'),
    icon: saveIcon,
    execute: args => {
      const dashboard = dashboardTracker.currentWidget;
      dashboard?.context.save();
    },
    isEnabled: args => inToolbar(args) || hasDashboard()
  });
  commands.addCommand(CommandIDs.openFromMetadata, {
    label: 'Open Metadata Dashboard',
    execute: args => {
      const notebook = notebookTracker.currentWidget;
      const notebookMetadata = getMetadata(notebook!);
      const notebookId = notebookMetadata.id;
      const cells = notebook?.content.widgets;
      const widgetStore = new WidgetStore({ id: 0, notebookTracker });
      for (const cell of cells!) {
        const metadata = getMetadata(cell);
        if (metadata !== undefined && !metadata.hidden) {
          const widgetInfo: WidgetInfo = {
            widgetId: DashboardWidget.createDashboardWidgetId(),
            notebookId,
            cellId: metadata.id,
            pos: metadata.pos
          };
          widgetStore.addWidget(widgetInfo);
        }
      }
      const model = new DashboardModel({
        widgetStore,
        notebookTracker
      });
      const dashboard = new Dashboard({
        outputTracker,
        model
      });
      dashboard.updateLayoutFromWidgetStore();
      dashboard.model.mode = 'present';
      notebook?.context.addSibling(dashboard, { mode: 'split-left' });
    },
    isEnabled: args => {
      const notebook = notebookTracker.currentWidget;
      const metadata = getMetadata(notebook!);
      if (metadata !== undefined && metadata.hasDashboard !== undefined) {
        return metadata.hasDashboard;
      }
      return false;
    }
  });
  commands.addCommand(CommandIDs.toggleWidgetMode, {
    label: 'Snap to Grid',
    isToggled: args => {
      const widget = outputTracker.currentWidget!;
      return widget.mode === 'grid-edit';
    },
    execute: args => {
      const widget = outputTracker.currentWidget!;
      if (widget.mode === 'grid-edit') {
        widget.mode = 'free-edit';
      } else if (widget.mode === 'free-edit') {
        widget.mode = 'grid-edit';
      }
    }
  });
  commands.addCommand(CommandIDs.toggleInfiniteScroll, {
    label: 'Infinite Scroll',
    isToggled: args =>
      dashboardTracker.currentWidget?.model.scrollMode === 'infinite',
    execute: args => {
      const dashboard = dashboardTracker.currentWidget!;
      if (dashboard.model.scrollMode === 'infinite') {
        dashboard.model.scrollMode = 'constrained';
      } else {
        dashboard.model.scrollMode = 'infinite';
      }
    }
  });
  commands.addCommand(CommandIDs.trimDashboard, {
    label: 'Trim Dashboard',
    execute: args => {
      const dashboard = dashboardTracker.currentWidget;
      (dashboard?.layout as DashboardLayout).trimDashboard();
    }
  });
}

/**
 * A namespace for private functionality.
 */
namespace Private {
  /**
   * A dialog with two boxes for setting a dashboard's width and height.
   */
  export class ResizeHandler extends Widget {
    constructor(oldWidth: number, oldHeight: number) {
      const node = document.createElement('div');
      const name = document.createElement('label');
      name.textContent = 'Enter New Width/Height';
      const width = document.createElement('input');
      const height = document.createElement('input');
      width.type = 'number';
      height.type = 'number';
      width.min = '0';
      width.max = '10000';
      height.min = '0';
      height.max = '10000';
      width.required = true;
      height.required = true;
      width.placeholder = `Width (${oldWidth})`;
      height.placeholder = `Height (${oldHeight})`;
      node.appendChild(name);
      node.appendChild(width);
      node.appendChild(height);
      super({ node });
    }

    getValue(): number[] {
      const inputs = this.node.getElementsByTagName('input');
      const widthInput = inputs[0];
      const heightInput = inputs[1];
      return [+widthInput.value, +heightInput.value];
    }
  }
}

export default [
  classicRenderPlugin,
  viewerPlugin,
  notebookHeaderPlugin,
  dashboardHomePlugin,
  dashboardTrackerPlugin,
];
