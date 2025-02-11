/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { ISharedNotebook, IYText } from '@jupyter/ydoc';
import { type IEditorServices } from '@jupyterlab/codeeditor';
import {
  CodeMirrorEditorFactory,
  CodeMirrorMimeTypeService,
  EditorExtensionRegistry,
  EditorLanguageRegistry,
  EditorThemeRegistry,
  ybinding,
} from '@jupyterlab/codemirror';
import { Context, type DocumentRegistry } from '@jupyterlab/docregistry';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { createMarkdownParser } from '@jupyterlab/markedparser-extension';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import {
  NotebookModel,
  NotebookModelFactory,
  NotebookPanel,
  NotebookTracker,
  NotebookWidgetFactory,
  StaticNotebook,
  type INotebookModel,
  type Notebook,
} from '@jupyterlab/notebook';
import {
  RenderMimeRegistry,
  standardRendererFactories,
} from '@jupyterlab/rendermime';
import type {
  Contents,
  Kernel,
  ServiceManager,
  Session,
  SessionManager,
} from '@jupyterlab/services';
import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { Banner } from '@primer/react/experimental';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { newUuid } from '../../utils';
import { Lumino } from '../lumino';
import { Loader } from '../utils';
import { JupyterReactContentFactory } from './content';
import { Box } from '@primer/react';
import useNotebookStore from './NotebookState';
import type { DatalayerNotebookExtension } from './Notebook';
import { createPortal } from 'react-dom';
import { CellMetadataEditor } from './cell';
import type { OnSessionConnection } from '../../state';
import type { IChangedArgs } from '@jupyterlab/coreutils';
import addNotebookCommands from './NotebookCommands';
import {
  Completer,
  CompleterModel,
  CompletionHandler,
  KernelCompleterProvider,
  ProviderReconciliator,
} from '@jupyterlab/completer';
import type { Cell, ICellModel } from '@jupyterlab/cells';

const COMPLETER_TIMEOUT_MILLISECONDS = 1000;
const FALLBACK_NOTEBOOK_PATH = '.datalayer/ping.ipynb';

/**
 * Base notebook component properties
 */
export interface IBaseNotebookProps {
  /**
   * Notebook ID
   */
  id: string;
  /**
   * Notebook extensions
   */
  extensions: DatalayerNotebookExtension[];
  /**
   * Kernel ID to connect to
   */
  kernelId?: string;
  /**
   * Service manager
   */
  serviceManager: ServiceManager.IManager;
  /**
   * Notebook content model
   */
  model: NotebookModel;
  /**
   * Whether nbgrader mode is activated or not.
   */
  nbgrader: boolean;
  /**
   * Callback on session connection changed
   */
  onSessionConnection?: OnSessionConnection;
  /**
   * Notebook path
   *
   * Set this only if you use Jupyter Server to fetch
   * and save the content.
   */
  path?: string;
}

/**
 * Base notebook component
 *
 * The notebook model and kernel lifecycle is not handled by
 * this component.
 */
export function BaseNotebook(props: IBaseNotebookProps): JSX.Element {
  const {
    extensions,
    kernelId,
    serviceManager,
    model,
    nbgrader,
    onSessionConnection,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [extensionComponents, setExtensionComponents] = useState(
    new Array<JSX.Element>()
  );

  const notebookStore = useNotebookStore();

  const id = useMemo(() => props.id || newUuid(), [props.id]);
  const path = useMemo(
    () => props.path || FALLBACK_NOTEBOOK_PATH,
    [props.path]
  );
  // Features
  const features = useMemo(() => new CommonFeatures(), []);

  // Content factory
  const contentFactory = useMemo(
    () =>
      // FIXME missing nbgrader and CellSidebar
      new JupyterReactContentFactory(id, false, features.commandRegistry, {
        editorFactory: features.editorServices.factoryService.newInlineEditor,
      }),
    [id, features]
  );

  // Completer
  const [completer, setCompleter] = useState<CompletionHandler | null>(null);
  useEffect(() => {
    const completer = new Completer({ model: new CompleterModel() });
    // Dummy widget to initialize
    const widget = new Widget();
    const reconciliator = new ProviderReconciliator({
      context: {
        widget,
      },
      providers: [new KernelCompleterProvider()],
      timeout: COMPLETER_TIMEOUT_MILLISECONDS,
    });
    const handler = new CompletionHandler({ completer, reconciliator });
    completer.hide();
    Widget.attach(completer, document.body);

    setCompleter(handler);

    return () => {
      handler.dispose();
      completer.dispose();
      widget.dispose();
    };
  }, []);

  // Widget factory
  const [widgetFactory, setWidgetFactory] =
    useState<NotebookWidgetFactory | null>(null);
  useEffect(() => {
    const thisFactory = new NotebookWidgetFactory({
      name: 'Notebook',
      label: 'Notebook',
      modelName: 'notebook',
      fileTypes: ['notebook'],
      defaultFor: ['notebook'],
      preferKernel: true,
      autoStartDefault: false,
      canStartKernel: false,
      shutdownOnClose: false,
      rendermime: features.rendermime,
      contentFactory,
      mimeTypeService: features.editorServices.mimeTypeService,
      notebookConfig: {
        ...StaticNotebook.defaultNotebookConfig,
        recordTiming: true,
      },
    });
    setWidgetFactory(thisFactory);

    return () => {
      thisFactory.dispose();
      setWidgetFactory(factory => (factory === thisFactory ? null : factory));
    };
  }, [contentFactory, features]);

  // Tracker & commands
  const [tracker, setTracker] = useState<NotebookTracker | null>(null);
  useEffect(() => {
    const thisTracker = completer
      ? new NotebookTracker({ namespace: id })
      : null;
    const commands = completer
      ? addNotebookCommands(
          features.commandRegistry,
          completer,
          thisTracker!,
          props.path
        )
      : null;
    setTracker(thisTracker);

    return () => {
      commands?.dispose();
      thisTracker?.dispose();
      setTracker(tracker => (tracker === thisTracker ? null : tracker));
    };
  }, [completer, id, features.commandRegistry, props.path]);

  // Context
  const [context, setContext] = useState<Context<NotebookModel> | null>(null);
  useEffect(() => {
    const factory = new DummyModelFactory(model);
    const thisContext = new Context<NotebookModel>({
      factory,
      manager: serviceManager,
      path,
      kernelPreference: {
        shouldStart: false,
        canStart: false,
        autoStartDefault: false,
        shutdownOnDispose: false,
      },
    });

    initializeContext(
      thisContext,
      id,
      // Initialization must not trigger revert in case we set up the model content
      path !== FALLBACK_NOTEBOOK_PATH ? path : undefined,
      onSessionConnection
    );

    setContext(thisContext);

    return () => {
      thisContext.dispose();
      factory.dispose();
      setContext(context => (context === thisContext ? null : context));
    };
  }, [id, serviceManager, model, onSessionConnection, path]);

  // Set kernel
  useEffect(() => {
    if (context && kernelId) {
      context.sessionContext.changeKernel({ id: kernelId });
    }
  }, [context, kernelId]);

  // Notebook
  const [panel, setPanel] = useState<NotebookPanel | null>(null);
  useEffect(() => {
    let thisPanel: NotebookPanel | null = null;
    if (context) {
      thisPanel = widgetFactory?.createNew(context) ?? null;
      if (thisPanel) {
        // Update the notebook state further to events.
        thisPanel.content.modelChanged.connect((notebook, _) => {
          if (notebook.model) {
            notebookStore.changeModel({ id, notebookModel: notebook.model });
          }
        });
        thisPanel.content.activeCellChanged.connect((_, cellModel) => {
          if (cellModel === null) {
            notebookStore.activeCellChange({ id, cellModel: undefined });
          } else {
            notebookStore.activeCellChange({ id, cellModel });
            if (!context.model.readOnly) {
              // FIXME this should be moved to a Notebook extension to drop notebookStore usage
              const panelDiv = document.getElementById(
                'right-panel-id'
              ) as HTMLDivElement;
              if (panelDiv) {
                const cellMetadataOptions = (
                  <Box mt={3}>
                    <CellMetadataEditor
                      notebookId={id}
                      cell={cellModel}
                      nbgrader={nbgrader}
                    />
                  </Box>
                );
                const portal = createPortal(cellMetadataOptions, panelDiv);
                notebookStore.setPortalDisplay({
                  id,
                  portalDisplay: { portal, pinned: false },
                });
              }
            }
          }
        });
        thisPanel.sessionContext.statusChanged.connect((_, kernelStatus) => {
          notebookStore.changeKernelStatus({ id, kernelStatus });
        });

        setExtensionComponents(
          extensions.map(extension => {
            extension.init({
              notebookId: id,
              commands: features.commandRegistry,
            });
            extension.createNew(thisPanel!, context);

            return extension.component ?? <></>;
          })
        );
        setIsLoading(false);
      }
    }

    setPanel(thisPanel);
    if (!thisPanel) {
      setExtensionComponents([]);
    }

    return () => {
      try {
        thisPanel?.dispose();
      } catch (reason) {}
      setPanel(panel => (panel === thisPanel ? null : panel));
    };
  }, [
    context,
    completer,
    extensions,
    features,
    nbgrader,
    notebookStore,
    widgetFactory,
  ]);

  useEffect(() => {
    let isMounted = true;
    if (panel) {
      if (tracker) {
        if (!tracker.has(panel)) {
          tracker.add(panel).catch(reason => {
            console.error(`Failed to track the notebook panel '${id}'.`);
          });
        }
      }

      if (completer) {
        // Setup the completer here as it requires the panel
        panel.context.sessionContext.ready.then(() => {
          if (!isMounted) {
            return;
          }
          const editor = panel.content.activeCell?.editor;
          const provider = new KernelCompleterProvider();
          const reconciliator = new ProviderReconciliator({
            context: {
              widget: panel,
              editor,
              session: panel.context.sessionContext.session,
            },
            providers: [provider],
            timeout: COMPLETER_TIMEOUT_MILLISECONDS,
          });
          completer.editor = editor;
          completer.reconciliator = reconciliator;
          panel.content.activeCellChanged.connect(
            (notebook: Notebook, cell: Cell<ICellModel> | null) => {
              if (cell) {
                cell.ready.then(() => {
                  completer.editor = cell?.editor;
                });
              }
            }
          );
        });
      }
    }

    return () => {
      isMounted = false;
      // Reset the completer
      if (completer) {
        completer.editor = null;
        completer.reconciliator = new ProviderReconciliator({
          context: {
            widget: new Widget(),
          },
          providers: [new KernelCompleterProvider()],
          timeout: COMPLETER_TIMEOUT_MILLISECONDS,
        });
      }
    };
  }, [completer, panel, tracker]);

  const onKeyDown = useCallback(
    (event: any) => {
      features.commandRegistry.processKeydownEvent(event);
    },
    [features.commandRegistry]
  );

  // FIXME
  // - add ipywidgets
  // - connect signals - see adapter - fix ipywidget and kernel transfer

  return (
    <>
      {extensionComponents.map((extensionComponent, index) => {
        return (
          <Box key={`${extensionComponent}-${index}`}>{extensionComponent}</Box>
        );
      })}
      {isLoading ? (
        <Loader key="notebook-loader" />
      ) : panel ? (
        <Box onKeyDownCapture={onKeyDown}>
          <Lumino id={id} key="notebook-container">
            {panel}
          </Lumino>
        </Box>
      ) : (
        <Banner
          key="notebook-error"
          variant="critical"
          description="Unable to create the notebook view."
          hideTitle={true}
        />
      )}
    </>
  );
}

/**
 * Common immutable JupyterLab features required for the notebook panel.
 */
class CommonFeatures {
  protected _commandRegistry: CommandRegistry;
  protected _editorServices: IEditorServices;
  protected _rendermime: RenderMimeRegistry;

  constructor() {
    this._commandRegistry = new CommandRegistry();

    const languages = new EditorLanguageRegistry();
    // Register default languages.
    for (const language of EditorLanguageRegistry.getDefaultLanguages()) {
      languages.addLanguage(language);
    }
    // Add Jupyter Markdown flavor here to support code block highlighting.
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

    const initialFactories = standardRendererFactories.filter(
      factory => factory.mimeTypes[0] !== 'text/javascript'
    );
    initialFactories.push(jsonRendererFactory);
    initialFactories.push(javascriptRendererFactory);

    this._rendermime = new RenderMimeRegistry({
      initialFactories,
      latexTypesetter: new MathJaxTypesetter(),
      markdownParser: createMarkdownParser(languages),
    });

    const mimeTypeService = new CodeMirrorMimeTypeService(languages);

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

    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages: languages,
    });
    this._editorServices = {
      factoryService,
      mimeTypeService,
    };
  }

  get commandRegistry(): CommandRegistry {
    return this._commandRegistry;
  }

  get editorServices(): IEditorServices {
    return this._editorServices;
  }

  get rendermime(): RenderMimeRegistry {
    return this._rendermime;
  }
}

/**
 * Dummy notebook factory
 *
 * It returns the provided notebook model.
 */
class DummyModelFactory extends NotebookModelFactory {
  constructor(protected model: NotebookModel) {
    super();
  }

  createNew(
    options?: DocumentRegistry.IModelOptions<ISharedNotebook>
  ): NotebookModel {
    return this.model;
  }
}

function initializeContext(
  context: Context,
  id: string,
  path?: string,
  onSessionConnection?: OnSessionConnection
) {
  const shuntContentManager = path ? false : true;

  // TODO we should implement our own thing rather this ugly Javascript patch.
  // These are fixes on the Context and the SessionContext to have more control on the kernel launch.
  (context.sessionContext as any)._initialize = async (): Promise<boolean> => {
    const manager = context.sessionContext.sessionManager as SessionManager;
    await manager.ready;
    await manager.refreshRunning();
    const model = find(manager.running(), model => {
      // !! we need to set the kernelPreference id
      return (
        model.kernel?.id === (context.sessionContext.kernelPreference.id ?? '')
      );
    });
    if (model) {
      try {
        const session = manager.connectTo({
          model: {
            ...model,
            path: path ?? model.path,
            name: path ?? model.name,
          },
          kernelConnectionOptions: {
            handleComms: true,
          },
        });
        (context!.sessionContext as any)._handleNewSession(session);
        // Dispose the previous KernelConnection to avoid errors with Comms.
        this._kernel?.connection?.dispose();
      } catch (err) {
        void (context!.sessionContext as any)._handleSessionError(err);
        return Promise.reject(err);
      }
    }
    return await (context!.sessionContext as any)._startIfNecessary();
  };

  // Custom dispose that does not dispose the model
  (context as any).dispose = (): void => {
    if (context.isDisposed) {
      return;
    }
    (context as any)._isDisposed = true;
    context.sessionContext.dispose();
    (context as any)._disposed.emit(void 0);
    Signal.clearData(this);
  };

  if (shuntContentManager) {
    // If nbformat is provided and we don't want to interact with the Content Manager.
    (context as any)._populate = async (): Promise<void> => {
      (context as any)._isPopulated = true;
      (context as any)._isReady = true;
      (context as any)._populatedPromise.resolve(void 0);
      // Add a checkpoint if none exists and the file is writable.
      // Force skip this step for nbformat notebooks.
      // await (context as any)._maybeCheckpoint(false);
      if (context.isDisposed) {
        return;
      }
      // Update the kernel preference.
      const name =
        (context as any)._model.defaultKernelName ||
        context.sessionContext.kernelPreference.name;
      (context as any).sessionContext.kernelPreference = {
        ...context.sessionContext.kernelPreference,
        name,
        language: (context as any)._model.defaultKernelLanguage,
      };
      // Note: we don't wait on the session to initialize
      // so that the user can be shown the content before
      // any kernel has started.
      void context.sessionContext.initialize().then((shouldSelect: boolean) => {
        if (shouldSelect) {
          void (context as any)._dialogs.selectKernel(
            (context!.sessionContext as any).sessionContext
          );
        }
      });
    };
    (context as any).initialize = async (isNew: boolean): Promise<void> => {
      (context as Context<INotebookModel>).model.dirty = false;
      const now = new Date().toISOString();
      const model: Contents.IModel = {
        path: id,
        name: id,
        type: 'notebook',
        content: undefined,
        writable: true,
        created: now,
        last_modified: now,
        mimetype: 'application/x-ipynb+json',
        format: 'json',
      };
      (context as any)._updateContentsModel(model);
      await (context as any)._populate();
      (context as Context<INotebookModel>).model.sharedModel.clearUndoHistory();
    };
  }

  // Connect signals
  context.sessionContext.sessionChanged.connect(
    (
      _,
      args: IChangedArgs<
        Session.ISessionConnection | null,
        Session.ISessionConnection | null,
        'session'
      >
    ) => {
      const session = args.newValue;
      console.log('Current Jupyter Session Connection.', session);
      onSessionConnection?.(session ?? undefined);
      // FIXME
      // if (session) {
      //   this._iPyWidgetsManager?.registerWithKernel(session.kernel);
      //   this._iPyWidgetsManager?.restoreWidgets(this._notebookPanel?.model!);
      // }
    }
  );
  context.sessionContext.kernelChanged.connect(
    (
      _,
      args: IChangedArgs<
        Kernel.IKernelConnection | null,
        Kernel.IKernelConnection | null,
        'kernel'
      >
    ) => {
      const kernelConnection = args.newValue;
      console.log('Current Jupyter Kernel Connection.', kernelConnection);
      if (kernelConnection && !kernelConnection.handleComms) {
        console.log(
          'Updating the current Kernel Connection to enforce Comms support.',
          kernelConnection.handleComms
        );
        (kernelConnection as any).handleComms = true;
      }
    }
  );
  context.sessionContext.ready.then(() => {
    onSessionConnection?.(context?.sessionContext.session ?? undefined);
    // FIXME
    // const kernelConnection = context?.sessionContext.session?.kernel;
    // if (this._kernelTransfer) {
    //   if (kernelConnection) {
    //     kernelConnection.connectionStatusChanged.connect((_, status) => {
    //       if (status === 'connected') {
    //         this._kernelTransfer!.transfer(kernelConnection);
    //       }
    //     });
    //   }
    // }
  });

  // Initialize the context
  context.initialize(path ? false : true);
}
