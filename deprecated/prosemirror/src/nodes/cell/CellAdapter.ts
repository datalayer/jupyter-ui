import { BoxPanel } from '@lumino/widgets';
import { SessionContext, Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { CodeCellModel, CodeCell } from '@jupyterlab/cells';
import { CodeMirrorMimeTypeService } from '@jupyterlab/codemirror';
import { runIcon } from '@jupyterlab/ui-components';
import { Completer, CompleterModel, CompletionHandler, ProviderReconciliator, KernelCompleterProvider } from '@jupyterlab/completer';
import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
import { SessionManager, KernelManager, KernelSpecManager, } from '@jupyterlab/services';
import { ServerConnection } from '@jupyterlab/services';
import { CommandRegistry } from '@lumino/commands';
import { createStandaloneCell, YCodeCell } from '@jupyter-notebook/ydoc';
// import { Session } from '@jupyterlab/services';
// import { IPyWidgetsClassicManager } from "../../ipywidgets/IPyWidgetsClassicManager";
// import { requireLoader } from "@jupyter-widgets/html-manager";
// import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";

import '@jupyterlab/cells/style/index.css';

// This should be only index.css, looks like jupyterlab has a regression here...
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

import './CellAdapter.css';

class CellAdapter {
  private _codeCell: CodeCell;
  private _cellPanel: BoxPanel;
  private _sessionContext: SessionContext;

  constructor(source: string) {
    this._cellPanel = new BoxPanel();
    this._cellPanel.direction = 'top-to-bottom';
    this._cellPanel.spacing = 0;
    this._cellPanel.addClass('dla-JupyterCell');
    const serverSettings = ServerConnection.makeSettings();
    const kernelManager = new KernelManager({
      serverSettings
    });
    const specsManager = new KernelSpecManager({
      serverSettings
    });
    const sessionManager = new SessionManager({
      serverSettings,
      kernelManager
    });
    this._sessionContext = new SessionContext({
      sessionManager,
      specsManager,
      name: 'Datalayer'
    });
    const mimeService = new CodeMirrorMimeTypeService();
    // Initialize the command registry with the bindings.
    const commands = new CommandRegistry();
    const useCapture = true;
    // Setup the keydown listener for the document.
    document.addEventListener(
      'keydown',
      event => {
        commands.processKeydownEvent(event);
      },
      useCapture
    );
    // Create the cell widget with a default rendermime instance.
//    const iPyWidgetsClassicManager = new IPyWidgetsClassicManager({ loader: requireLoader });
    const rendermime = new RenderMimeRegistry({ initialFactories });
    /*
    rendermime.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: (options) => new WidgetRenderer(options, iPyWidgetsClassicManager),
      },
      0
    );
    */
    const codeCell = new CodeCell({
      rendermime,
      model: new CodeCellModel({
        sharedModel: createStandaloneCell({
          cell_type: 'code',
          source,
          metadata: { collapsed: false }
        }) as YCodeCell
      })
    });
    /*
    this._sessionContext.kernelChanged.connect((sender: SessionContext, arg: Session.ISessionConnection.IKernelChangedArgs) => {
      const kernelConnection = arg.newValue;
      iPyWidgetsClassicManager.registerWithKernel(kernelConnection)
    });
    */
    this._codeCell = codeCell.initializeState();
    // Handle the mimeType for the current kernel asynchronously.
    this._sessionContext.kernelChanged.connect(() => {
      void this._sessionContext.session?.kernel?.info.then(info => {
        const lang = info.language_info;
        const mimeType = mimeService.getMimeTypeByLanguage(lang);
        this._codeCell.model.mimeType = mimeType;
      });
    });
    // Use the default kernel.
    this._sessionContext.kernelPreference = { autoStartDefault: true };
    // Set up a completer.
    const editor = this._codeCell.editor;
    const model = new CompleterModel();
    const completer = new Completer({ editor, model });
    const timeout = 1000;
    const provider = new KernelCompleterProvider();
    const reconciliator = new ProviderReconciliator({
      context: { widget: this._codeCell, editor, session: this._sessionContext.session },
      providers: [provider],
      timeout: timeout,
    });
    const handler = new CompletionHandler({ completer, reconciliator });
    // Set the handler's editor.
    handler.editor = editor;
    // Hide the widget when it first loads.
    completer.hide();
    // Create a toolbar for the cell.
    const toolbar = new Toolbar();
    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    const runButton = new ToolbarButton({
      icon: runIcon,
      onClick: () => {
        CodeCell.execute(this._codeCell, this._sessionContext);
      },
      tooltip: 'Run'
    });
    toolbar.addItem('run', runButton);
    toolbar.addItem('interrupt', Toolbar.createInterruptButton(this._sessionContext));
    toolbar.addItem('restart', Toolbar.createRestartButton(this._sessionContext));
    // toolbar.addItem('name', Toolbar.createKernelNameItem(this._sessionContext));
    toolbar.addItem('status', Toolbar.createKernelStatusItem(this._sessionContext));
    this._cellPanel.addWidget(completer);
    this._cellPanel.addWidget(toolbar);
    BoxPanel.setStretch(toolbar, 0);
    this._cellPanel.addWidget(this._codeCell);
    BoxPanel.setStretch(this._codeCell, 1);
    // Handle widget state.
    window.addEventListener('resize', () => {
      this._cellPanel.update();
    });
    this._codeCell.outputsScrolled = false;
    this._codeCell.activate();
    // Add the commands.
    commands.addCommand('invoke:completer', {
      execute: () => {
        handler.invoke();
      }
    });
    commands.addCommand('run:cell', {
      execute: () => CodeCell.execute(this._codeCell, this._sessionContext)
    });
    // Add the key bindings.
    commands.addKeyBinding({
      selector: '.jp-InputArea-editor.jp-mod-completer-enabled',
      keys: ['Tab'],
      command: 'invoke:completer'
    });
    commands.addKeyBinding({
      selector: '.jp-InputArea-editor',
      keys: ['Shift Enter'],
      command: 'run:cell'
    });
  }

  get panel(): BoxPanel {
    return this._cellPanel;
  }

  get codeCell(): CodeCell {
    return this._codeCell;
  }

  get sessionContext(): SessionContext {
    return this._sessionContext;
  }

  execute = () => {
    CodeCell.execute(this._codeCell, this._sessionContext);
  }

}

export default CellAdapter;
