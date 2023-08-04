import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { MainAreaWidget, ICommandPalette, IToolbarWidgetRegistry, Toolbar, ISessionContextDialogs, SessionContextDialogs } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILauncher } from '@jupyterlab/launcher';
import { NotebookWidgetFactory, NotebookPanel, StaticNotebook, ToolbarItems, ExecutionIndicator } from '@jupyterlab/notebook';
import { ToolbarItems as DocToolbarItems } from '@jupyterlab/docmanager-extension';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { IObservableList } from '@jupyterlab/observables';
import { ITranslator } from '@jupyterlab/translation';
import { reactIcon } from '@jupyterlab/ui-components';
import { requestAPI } from './handler';
import { DatalayerWidget } from './widget';

import '../../../style/index.css';

/**
 * The command IDs used by the plugin.
 */
namespace CommandIDs {
  export const create = 'create-jupyter-react-widget';
}
/**
 * The name of the factory that creates notebooks.
 */
const WIDGET_FACTORY_NAME = 'Datalayer Notebook';

/**
 * Initialization data for the @datalayer/jupyter-react extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
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

    const sessionContextDialogs =
      sessionContextDialogs_ ?? new SessionContextDialogs({ translator });

    let toolbarFactory:
      | ((
          widget: NotebookPanel
        ) =>
          | DocumentRegistry.IToolbarItem[]
          | IObservableList<DocumentRegistry.IToolbarItem>)
      | undefined;
  
    // Register notebook toolbar widgets.
    toolbarRegistry.addFactory<NotebookPanel>(WIDGET_FACTORY_NAME, 'save', panel =>
      DocToolbarItems.createSaveButton(commands, panel.context.fileChanged)
    );
    toolbarRegistry.addFactory<NotebookPanel>(WIDGET_FACTORY_NAME, 'cellType', panel =>
      ToolbarItems.createCellTypeItem(panel, translator)
    );
    toolbarRegistry.addFactory<NotebookPanel>(WIDGET_FACTORY_NAME, 'kernelName', panel =>
      Toolbar.createKernelNameItem(
        panel.sessionContext,
        sessionContextDialogs,
        translator
      )
    );
    toolbarRegistry.addFactory<NotebookPanel>(
      WIDGET_FACTORY_NAME,
      'executionProgress',
      panel => {
        const loadingSettings = settingRegistry?.load(plugin.id);
        const indicator = ExecutionIndicator.createExecutionIndicatorItem(
          panel,
          translator,
          loadingSettings
        );
        void loadingSettings?.then(settings => {
          panel.disposed.connect(() => {
            settings.dispose();
          });
        });
        return indicator;
      }
    );

    const factory = new NotebookWidgetFactory({
      name: WIDGET_FACTORY_NAME,
      label: WIDGET_FACTORY_NAME,
      fileTypes: ['notebook'],
      modelName: 'notebook',
      defaultFor: ['notebook'],
      preferKernel: true,
      canStartKernel: true,
      rendermime,
      contentFactory,
      editorConfig: StaticNotebook.defaultEditorConfig,
      notebookConfig: StaticNotebook.defaultNotebookConfig,
      mimeTypeService: editorServices.mimeTypeService,
      toolbarFactory,
      translator,
    });

    app.docRegistry.addWidgetFactory(factory);

    const { commands } = app;
    const command = CommandIDs.create;
    commands.addCommand(command, {
      caption: 'Show Jupyter React',
      label: 'Jupyter React',
      icon: (args: any) => reactIcon,
      execute: () => {
        const content = new DatalayerWidget();
        const widget = new MainAreaWidget<DatalayerWidget>({ content });
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
        .load(plugin.id)
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

  }
}

export default plugin;
