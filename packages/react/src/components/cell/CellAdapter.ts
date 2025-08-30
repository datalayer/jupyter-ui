/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BoxPanel, Widget } from '@lumino/widgets';
import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { JSONObject } from '@lumino/coreutils';
import {
  SessionContext,
  ISessionContext,
  Toolbar,
  ToolbarButton,
} from '@jupyterlab/apputils';
import {
  CodeCellModel,
  CodeCell,
  Cell,
  MarkdownCell,
  RawCell,
  MarkdownCellModel,
} from '@jupyterlab/cells';
import { IOutput } from '@jupyterlab/nbformat';
import { Kernel as JupyterKernel, KernelMessage } from '@jupyterlab/services';
import {
  ybinding,
  CodeMirrorMimeTypeService,
  EditorLanguageRegistry,
  CodeMirrorEditorFactory,
  EditorExtensionRegistry,
  EditorThemeRegistry,
} from '@jupyterlab/codemirror';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import {
  Completer,
  CompleterModel,
  CompletionHandler,
  ProviderReconciliator,
  KernelCompleterProvider,
} from '@jupyterlab/completer';
import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories,
} from '@jupyterlab/rendermime';
import {
  Session,
  ServerConnection,
  SessionManager,
  KernelManager,
  KernelSpecManager,
} from '@jupyterlab/services';
import { runIcon } from '@jupyterlab/ui-components';
import {
  createStandaloneCell,
  YCodeCell,
  IYText,
  YMarkdownCell,
} from '@jupyter/ydoc';
import { execute as executeOutput } from './../output/OutputExecutor';
import {
  ClassicWidgetManager,
  WIDGET_MIMETYPE,
  WidgetRenderer,
} from '../../jupyter/ipywidgets/classic';
import { requireLoader as loader } from '../../jupyter/ipywidgets/libembed-amd';
import Kernel from '../../jupyter/kernel/Kernel';
import getMarked from '../notebook/marked/marked';
import CellCommands from './CellCommands';
import { cellsStore } from './CellState';

interface BoxOptions {
  showToolbar?: boolean;
}

export class CellAdapter {
  private _id: string;
  private _outputs: IOutput[];
  private _cell: CodeCell | MarkdownCell | RawCell;
  private _kernel: Kernel;
  private _panel: BoxPanel;
  private _sessionContext: SessionContext;
  private _type: 'code' | 'markdown' | 'raw';
  private _iPyWidgetsClassicManager?: ClassicWidgetManager;

  public constructor(options: CellAdapter.ICellAdapterOptions) {
    const { id, type, source, outputs, serverSettings, kernel, boxOptions } =
      options;
    this._id = id;
    this._outputs = outputs;
    this._kernel = kernel;
    this._type = type;
    this.setupCell(type, source, serverSettings, kernel, boxOptions);
  }

  private setupCell(
    type = 'code',
    source: string,
    serverSettings: ServerConnection.ISettings,
    kernel: Kernel,
    boxOptions?: BoxOptions
  ) {
    const kernelManager =
      kernel.kernelManager ??
      new KernelManager({
        serverSettings,
      });
    const sessionManager =
      kernel.sessionManager ??
      new SessionManager({
        serverSettings,
        kernelManager,
      });
    const specsManager =
      kernel.kernelSpecManager ??
      new KernelSpecManager({
        serverSettings,
      });
    const kernelPreference: ISessionContext.IKernelPreference = kernel
      ? {
          id: kernel.id,
          shouldStart: false,
          autoStartDefault: false,
          shutdownOnDispose: false,
        }
      : {
          name: 'python',
          shouldStart: true,
          autoStartDefault: true,
          shutdownOnDispose: true,
        };

    this._sessionContext = new SessionContext({
      name: kernel?.path,
      path: kernel?.path,
      sessionManager,
      specsManager,
      type: 'python',
      kernelPreference,
    });

    // These are fixes to have more control on the kernel launch.
    (this._sessionContext as any)._initialize = async (): Promise<boolean> => {
      const manager = (this._sessionContext as any)
        .sessionManager as SessionManager;
      await manager.ready;
      await manager.refreshRunning();
      const model = find(manager.running(), item => {
        //          return (item as any).path === (this._sessionContext as any)._path;
        return item.kernel?.id === this._kernel.id;
      });
      if (model) {
        try {
          const session = manager.connectTo({
            model,
            kernelConnectionOptions: {
              handleComms: true,
            },
          });
          // Force handleComms to true as we know the kernel supports it
          if (session.kernel && !session.kernel.handleComms) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (session.kernel as any).handleComms = true;
          }
          (this._sessionContext as any)._handleNewSession(session);
        } catch (err) {
          void (this._sessionContext as any)._handleSessionError(err);
          return Promise.reject(err);
        }
      }
      return await (this._sessionContext as any)._startIfNecessary();
    };

    const themes = new EditorThemeRegistry();
    for (const theme of EditorThemeRegistry.getDefaultThemes()) {
      themes.addTheme(theme);
    }
    const editorExtensions = () => {
      const registry = new EditorExtensionRegistry();
      for (const extensionFactory of EditorExtensionRegistry.getDefaultExtensions(
        { themes }
      )) {
        registry.addExtension(extensionFactory);
      }
      registry.addExtension({
        name: 'shared-model-binding',
        factory: options => {
          const sharedModel = options.model.sharedModel as IYText;
          return EditorExtensionRegistry.createImmutableExtension(
            ybinding({
              ytext: sharedModel.ysource,
              undoManager: sharedModel.undoManager ?? undefined,
            })
          );
        },
      });
      return registry;
    };
    const languages = new EditorLanguageRegistry();
    for (const language of EditorLanguageRegistry.getDefaultLanguages()) {
      languages.addLanguage(language);
    }
    languages.addLanguage({
      name: 'ipythongfm',
      mime: 'text/x-ipythongfm',
      load: async () => {
        // TODO: add support for LaTeX.
        const m = await import('@codemirror/lang-markdown');
        return m.markdown({
          codeLanguages: (info: string) => languages.findBest(info) as any,
        });
      },
    });
    const mimeService = new CodeMirrorMimeTypeService(languages);
    const commands = new CommandRegistry();
    const useCapture = true;
    document.addEventListener(
      'keydown',
      event => {
        // Trigger and process event only in current focused cell
        const activeElement = document.activeElement;
        if (
          activeElement &&
          activeElement.closest('.dla-Jupyter-Cell') === this._cell.node
        ) {
          commands.processKeydownEvent(event);
        }
      },
      useCapture
    );
    const rendermime = new RenderMimeRegistry({
      initialFactories,
      latexTypesetter: new MathJaxTypesetter(),
      markdownParser: getMarked(languages),
    });
    this._iPyWidgetsClassicManager = new ClassicWidgetManager({ loader });
    rendermime.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: options =>
          new WidgetRenderer(
            options,
            this._iPyWidgetsClassicManager as ClassicWidgetManager
          ),
      },
      0
    );
    // Don't register immediately - wait for session context to be ready
    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages,
    });
    //
    const cellModel = createStandaloneCell({
      cell_type: type,
      source: source,
      outputs: this._outputs,
      metadata: {},
    });
    const contentFactory = new Cell.ContentFactory({
      editorFactory: factoryService.newInlineEditor.bind(factoryService),
    });
    if (type === 'code') {
      this._cell = new CodeCell({
        rendermime,
        model: new CodeCellModel({ sharedModel: cellModel as YCodeCell }),
        contentFactory: contentFactory,
      });
    } else if (type === 'markdown') {
      this._cell = new MarkdownCell({
        rendermime,
        model: new MarkdownCellModel({
          sharedModel: cellModel as YMarkdownCell,
        }),
        contentFactory: contentFactory,
      });
    }
    this._cell.addClass('dla-Jupyter-Cell');
    this._cell.initializeState();
    if (this._type === 'markdown') {
      (this._cell as MarkdownCell).rendered = false;
    }
    //
    let widgetManagerRegistered = false;
    let registeredKernelId: string | null = null;

    const registerWidgetManager = async (
      kernelConnection: JupyterKernel.IKernelConnection | null
    ) => {
      if (
        kernelConnection &&
        (!widgetManagerRegistered || registeredKernelId !== kernelConnection.id)
      ) {
        try {
          // Ensure handleComms is enabled before registering
          if (!kernelConnection.handleComms) {
            console.warn(
              'Kernel connection does not handle Comms, enabling it',
              kernelConnection.id
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (kernelConnection as any).handleComms = true;
          }

          widgetManagerRegistered = true;
          registeredKernelId = kernelConnection.id;

          // Wait for kernel info to ensure it's fully ready
          await kernelConnection.info;

          // Double-check that kernel is still connected after waiting for info.
          if (kernelConnection.connectionStatus === 'connected') {
            // Register the widget manager with the properly configured kernel.
            this._iPyWidgetsClassicManager?.registerWithKernel(
              kernelConnection
            );
          } else {
            console.log(
              'Kernel disconnected while waiting for info, will retry on next connection...'
            );
          }
        } catch (error) {
          console.error(
            'Error getting kernel info or registering widget manager:',
            error
          );
          widgetManagerRegistered = false;
          registeredKernelId = null;
          // Fallback: try registering anyway after a delay
          setTimeout(() => {
            if (
              kernelConnection.connectionStatus === 'connected' &&
              registeredKernelId !== kernelConnection.id
            ) {
              this._iPyWidgetsClassicManager?.registerWithKernel(
                kernelConnection
              );
              widgetManagerRegistered = true;
              registeredKernelId = kernelConnection.id;
            }
          }, 1000);
        }
      } else if (!kernelConnection && widgetManagerRegistered) {
        // Unregister if kernel is null
        this._iPyWidgetsClassicManager?.registerWithKernel(null);
        widgetManagerRegistered = false;
        registeredKernelId = null;
      }
    };

    this._sessionContext.kernelChanged.connect(
      (_, arg: Session.ISessionConnection.IKernelChangedArgs) => {
        const kernelConnection = arg.newValue;
        widgetManagerRegistered = false; // Reset flag on kernel change
        registeredKernelId = null; // Reset kernel ID
        registerWidgetManager(kernelConnection);
      }
    );
    this._sessionContext.kernelChanged.connect(() => {
      void this._sessionContext.session?.kernel?.info.then(info => {
        if (this._type === 'code') {
          const lang = info.language_info;
          const mimeType = mimeService.getMimeTypeByLanguage(lang);
          if (this._cell.model) {
            this._cell.model.mimeType = mimeType;
          }
        }
      });
    });

    // Initial registration when session context is ready
    this._sessionContext.ready.then(() => {
      const kernelConnection = this._sessionContext.session?.kernel;
      registerWidgetManager(kernelConnection || null);
    });

    // Completer.
    const editor = this._cell.editor;
    const model = new CompleterModel();
    const completer = new Completer({ editor, model });
    const timeout = 1000;
    const provider = new KernelCompleterProvider();
    const reconciliator = new ProviderReconciliator({
      context: {
        widget: this._cell,
        editor,
        session: this._sessionContext.session,
      },
      providers: [provider],
      timeout,
    });
    const handler = new CompletionHandler({ completer, reconciliator });
    void this._sessionContext.ready.then(() => {
      const provider = new KernelCompleterProvider();
      handler.reconciliator = new ProviderReconciliator({
        context: {
          widget: this._cell,
          editor,
          session: this._sessionContext.session,
        },
        providers: [provider],
        timeout,
      });
    });
    this._cell.ready.then(() => {
      handler.editor = this._cell && this._cell.editor;
    });
    //
    CellCommands(commands, this._cell!, handler, this);
    completer.hide();
    completer.addClass('jp-Completer-Cell');
    Widget.attach(completer, document.body);
    const toolbar = new Toolbar();
    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    const runButton = new ToolbarButton({
      icon: runIcon,
      onClick: () => {
        if (this._type === 'code') {
          this.execute();
        } else if (this._type === 'markdown') {
          (this._cell as MarkdownCell).rendered = true;
        }
      },
      tooltip: 'Run',
    });
    toolbar.addItem('run', runButton);
    toolbar.addItem(
      'interrupt',
      Toolbar.createInterruptButton(this._sessionContext)
    );
    toolbar.addItem(
      'restart',
      Toolbar.createRestartButton(this._sessionContext)
    );
    // toolbar.addItem('name', Toolbar.createKernelNameItem(this._sessionContext));
    toolbar.addItem(
      'status',
      Toolbar.createKernelStatusItem(this._sessionContext)
    );

    if (this._type === 'code') {
      (this._cell as CodeCell).outputsScrolled = false;
    }
    this._cell.activate();

    this._panel = new BoxPanel();
    this._panel.direction = 'top-to-bottom';
    this._panel.spacing = 0;

    if (boxOptions?.showToolbar !== false) {
      this._panel.addWidget(toolbar);
    }
    this._panel.addWidget(this._cell);

    if (boxOptions?.showToolbar !== false) {
      BoxPanel.setStretch(toolbar, 0);
    }
    BoxPanel.setStretch(this._cell, 1);
    window.addEventListener('resize', () => {
      this._panel.update();
    });
    this._panel.update();
  }

  get panel(): BoxPanel {
    return this._panel;
  }

  get cell(): CodeCell | MarkdownCell | RawCell {
    return this._cell;
  }

  get sessionContext(): SessionContext {
    return this._sessionContext;
  }

  get kernel(): Kernel {
    return this._kernel;
  }

  execute = () => {
    if (this._type === 'code') {
      this._iPyWidgetsClassicManager?.registerWithKernel(
        this._kernel.connection
      );
      this._execute(this._cell as CodeCell);
    } else if (this._type === 'markdown') {
      (this._cell as MarkdownCell).rendered = true;
    }
  };

  private async _execute(
    cell: CodeCell,
    metadata?: JSONObject
  ): Promise<KernelMessage.IExecuteReplyMsg | void> {
    cellsStore.getState().setIsExecuting(this._id, true);
    const model = cell.model;
    const code = model.sharedModel.getSource();
    if (!code.trim() || !this.kernel) {
      model.sharedModel.transact(() => {
        model.clearExecution();
      }, false);
      cellsStore.getState().setIsExecuting(this._id, false);
      return new Promise(() => {});
    }
    const cellId = { cellId: model.sharedModel.getId() };
    metadata = {
      ...model.metadata,
      ...metadata,
      ...cellId,
    };
    const { recordTiming } = metadata;
    model.sharedModel.transact(() => {
      model.clearExecution();
      cell.outputHidden = false;
    }, false);
    cell.setPrompt('*');
    model.trusted = true;
    let future:
      | JupyterKernel.IFuture<
          KernelMessage.IExecuteRequestMsg,
          KernelMessage.IExecuteReplyMsg
        >
      | undefined;
    try {
      const kernelMessagePromise = executeOutput(
        this._id,
        code,
        cell.outputArea,
        this._kernel,
        metadata
      );
      // cell.outputArea.future assigned synchronously in `execute`.
      if (recordTiming) {
        const recordTimingHook = (msg: KernelMessage.IIOPubMessage) => {
          let label: string;
          switch (msg.header.msg_type) {
            case 'status':
              label = `status.${
                (msg as KernelMessage.IStatusMsg).content.execution_state
              }`;
              break;
            case 'execute_input':
              label = 'execute_input';
              break;
            default:
              return true;
          }
          // If the data is missing, estimate it to now
          // Date was added in 5.1: https://jupyter-client.readthedocs.io/en/stable/messaging.html#message-header
          const value = msg.header.date || new Date().toISOString();
          const timingInfo: any = Object.assign(
            {},
            model.getMetadata('execution')
          );
          timingInfo[`iopub.${label}`] = value;
          model.setMetadata('execution', timingInfo);
          return true;
        };
        cell.outputArea.future.registerMessageHook(recordTimingHook);
      } else {
        model.deleteMetadata('execution');
      }
      // Save this execution's future so we can compare in the catch below.
      future = cell.outputArea.future;
      const executeReplyMessage = (await kernelMessagePromise)!;
      model.executionCount = executeReplyMessage.content.execution_count;
      if (recordTiming) {
        const timingInfo = Object.assign(
          {},
          model.getMetadata('execution') as any
        );
        const started = executeReplyMessage.metadata.started as string;
        // Started is not in the API, but metadata IPyKernel sends
        if (started) {
          timingInfo['shell.execute_reply.started'] = started;
        }
        // Per above, the 5.0 spec does not assume date, so we estimate is required
        const finished = executeReplyMessage.header.date as string;
        timingInfo['shell.execute_reply'] =
          finished || new Date().toISOString();
        model.setMetadata('execution', timingInfo);
      }
      cellsStore.getState().setIsExecuting(this._id, false);
      return executeReplyMessage;
    } catch (e) {
      cellsStore.getState().setIsExecuting(this._id, false);
      // If we started executing, and the cell is still indicating this execution, clear the prompt.
      if (future && !cell.isDisposed && cell.outputArea.future === future) {
        cell.setPrompt('');
        if (recordTiming && future.isDisposed) {
          // Record the time when the cell execution was aborted
          const timingInfo: any = Object.assign(
            {},
            model.getMetadata('execution')
          );
          timingInfo['execution_failed'] = new Date().toISOString();
          model.setMetadata('execution', timingInfo);
        }
      }
      throw e;
    }
  }
}

export namespace CellAdapter {
  export type ICellAdapterOptions = {
    id: string;
    type: 'code' | 'markdown' | 'raw';
    source: string;
    outputs: IOutput[];
    serverSettings: ServerConnection.ISettings;
    kernel: Kernel;
    boxOptions?: BoxOptions;
  };
}

export default CellAdapter;
