import { BoxPanel, Widget } from '@lumino/widgets';
import { SessionContext, Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { CodeCellModel, CodeCell } from '@jupyterlab/cells';
import { CodeMirrorMimeTypeService } from '@jupyterlab/codemirror';
import { runIcon } from '@jupyterlab/ui-components';
import { Completer, CompleterModel, CompletionHandler, ConnectorProxy, KernelCompleterProvider } from '@jupyterlab/completer';
import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
// import { Session } from '@jupyterlab/services';
import { SessionManager, KernelManager, KernelSpecManager } from '@jupyterlab/services';
import { ServerConnection } from '@jupyterlab/services';
import { CommandRegistry } from '@lumino/commands';
// import { IPyWidgetsClassicManager } from "../../ipywidgets/IPyWidgetsClassicManager";
// import { requireLoader } from "@jupyter-widgets/html-manager";
// import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";
import CellCommands from './CellCommands';

import '@jupyterlab/application/style/index.css';
import '@jupyterlab/cells/style/index.css';
import '@jupyterlab/completer/style/index.css';
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
    const serverSettings = ServerConnection.makeSettings({
      appendToken: true,
      init: {
        credentials: "include",
        mode: 'cors',
      }
    });
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
    const rendermime = new RenderMimeRegistry({ initialFactories });
    /*
    const iPyWidgetsClassicManager = new IPyWidgetsClassicManager({ loader: requireLoader });
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
        cell: {
          cell_type: 'code',
          source: source,
          metadata: {
          }
        }
      })
    });
    /*
    this._sessionContext.kernelChanged.connect((sender: SessionContext, arg: Session.ISessionConnection.IKernelChangedArgs) => {
      const kernelConnection = arg.newValue;
      iPyWidgetsClassicManager.registerWithKernel(kernelConnection)
    });
    */
    this._codeCell = codeCell.initializeState();
    this._sessionContext.kernelChanged.connect(() => {
      void this._sessionContext.session?.kernel?.info.then(info => {
        const lang = info.language_info;
        const mimeType = mimeService.getMimeTypeByLanguage(lang);
        this._codeCell.model.mimeType = mimeType;
      });
    });
    this._sessionContext.kernelPreference = { autoStartDefault: true };
    const editor = this._codeCell.editor;
    const model = new CompleterModel();
    const completer = new Completer({ editor, model });
    const timeout = 1000;
    const provider = new KernelCompleterProvider();
    const connector = new ConnectorProxy(
      { widget: this._codeCell, editor, session: this._sessionContext.session },
      [provider],
      timeout
    );
    const handler = new CompletionHandler({ completer, connector });
    void this._sessionContext.ready.then(() => {
      const provider = new KernelCompleterProvider();
      handler.connector = new ConnectorProxy(
        { widget: this._codeCell, editor, session: this._sessionContext.session },
        [provider],
        timeout
      );
    });
    handler.editor = editor;
    CellCommands(commands, this._codeCell!, this._sessionContext, handler);  
    completer.hide();
    completer.addClass('jp-Completer-Cell');
    Widget.attach(completer, document.body);
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
    this._cellPanel.addWidget(toolbar);
    BoxPanel.setStretch(toolbar, 0);
    this._cellPanel.addWidget(this._codeCell);
    BoxPanel.setStretch(this._codeCell, 1);
    window.addEventListener('resize', () => {
      this._cellPanel.update();
    });
    this._codeCell.outputsScrolled = false;
    this._codeCell.activate();
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
