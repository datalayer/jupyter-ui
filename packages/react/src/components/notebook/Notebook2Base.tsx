/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo, useState } from 'react';
import type { ISessionContext } from '@jupyterlab/apputils';
import type { Cell, CodeCell, ICellModel } from '@jupyterlab/cells';
import { type IEditorServices } from '@jupyterlab/codeeditor';
import {
  CodeMirrorEditorFactory,
  CodeMirrorMimeTypeService,
  EditorExtensionRegistry,
  EditorLanguageRegistry,
  EditorThemeRegistry,
  ybinding,
} from '@jupyterlab/codemirror';
import {
  Completer,
  CompleterModel,
  CompletionHandler,
  KernelCompleterProvider,
  ProviderReconciliator,
} from '@jupyterlab/completer';
import { PathExt, type IChangedArgs } from '@jupyterlab/coreutils';
import { Context, type DocumentRegistry } from '@jupyterlab/docregistry';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { createMarkdownParser } from '@jupyterlab/markedparser-extension';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import type { INotebookContent } from '@jupyterlab/nbformat';
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
  type IRenderMime,
} from '@jupyterlab/rendermime';
import type {
  Contents,
  Kernel,
  ServiceManager,
  Session,
  SessionManager,
} from '@jupyterlab/services';
import type { ISessionConnection } from '@jupyterlab/services/lib/session/session';
import { YNotebook, type ISharedNotebook, type IYText } from '@jupyter/ydoc';
import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { DisposableSet } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import { Box } from '@datalayer/primer-addons';
import { Banner } from '@primer/react/experimental';
import { EditorView } from 'codemirror';
import {
  ICollaborationProvider,
  WIDGET_MIMETYPE,
  WidgetLabRenderer,
  WidgetManager,
} from '../../jupyter';
import type { OnSessionConnection } from '../../state';
import { newUuid, remoteUserCursors } from '../../utils';
import { Lumino } from '../lumino';
import { Loader } from '../utils';
import type { NotebookExtension } from './NotebookExtensions';
import { addNotebookCommands } from './NotebookCommands';
import { Notebook2Adapter } from './Notebook2Adapter';
import { notebookStore2 } from './Notebook2State';

const COMPLETER_TIMEOUT_MILLISECONDS = 1000;

const DEFAULT_EXTENSIONS = new Array<NotebookExtension>();

const FALLBACK_NOTEBOOK_PATH = '.datalayer/ping.ipynb';

/**
 * Base notebook component properties
 */
export interface INotebook2BaseProps {
  /**
   * Custom command registry.
   *
   * Note:
   * Providing it allows to command the component from an higher level.
   */
  commands?: CommandRegistry;
  /**
   * Notebook ID
   */
  id?: string;
  /**
   * Notebook extensions
   */
  extensions?: NotebookExtension[];
  /**
   * Kernel ID to connect to
   */
  kernelId?: string;
  /**
   * Additional cell output renderers.
   */
  renderers?: IRenderMime.IRendererFactory[];
  /**
   * Service manager
   */
  serviceManager?: ServiceManager.IManager;
  /**
   * Notebook content model
   */
  model: NotebookModel;
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
 *
 * Important
 * This component is not connected to any React stores.
 */
export function Notebook2Base(props: INotebook2BaseProps): JSX.Element {
  const {
    commands,
    extensions = DEFAULT_EXTENSIONS,
    kernelId,
    renderers,
    serviceManager,
    model,
    onSessionConnection,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [extensionComponents, setExtensionComponents] = useState(
    new Array<JSX.Element>()
  );
  const [completer, setCompleter] = useState<CompletionHandler | null>(null);
  const [adapter, setAdapter] = useState<Notebook2Adapter | null>(null);

  const id = useMemo(() => props.id || newUuid(), [props.id]);
  const path = useMemo(
    () => props.path || FALLBACK_NOTEBOOK_PATH,
    [props.path]
  );
  const features = useMemo(
    () => new CommonFeatures({ commands, renderers }),
    [commands, renderers]
  );
  const contentFactory = useMemo(
    () =>
      new NotebookPanel.ContentFactory({
        editorFactory: features.editorServices.factoryService.newInlineEditor,
      }),
    [features.editorServices.factoryService.newInlineEditor]
  );

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

  // Widget factory.
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

  // Tracker & commands.
  const [tracker, setTracker] = useState<NotebookTracker | null>(null);
  useEffect(() => {
    const thisTracker = completer
      ? new NotebookTracker({ namespace: id })
      : null;
    const commands = completer
      ? addNotebookCommands(
          features.commands,
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
  }, [completer, id, features.commands, props.path]);

  // Context
  const [context, setContext] = useState<Context<NotebookModel> | null>(null);
  useEffect(() => {
    const factory = new DummyModelFactory(model);
    const thisContext = new Context<NotebookModel>({
      factory,
      manager: serviceManager ?? (new NoServiceManager() as any),
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
      onSessionConnection,
      !serviceManager
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
    if (context && kernelId && !context.sessionContext.isDisposed) {
      context.sessionContext.changeKernel({ id: kernelId }).catch(reason => {
        console.error('Failed to change kernel model.', reason);
      });
    }
  }, [context, kernelId]);

  // Notebook
  const [panel, setPanel] = useState<NotebookPanel | null>(null);
  useEffect(() => {
    let thisPanel: NotebookPanel | null = null;
    let thisAdapter: Notebook2Adapter | null = null;
    let widgetsManager: WidgetManager | null = null;
    if (context) {
      thisPanel = widgetFactory?.createNew(context) ?? null;
      if (thisPanel) {
        // Create the adapter
        thisAdapter = new Notebook2Adapter(features.commands, thisPanel, context);
        setAdapter(thisAdapter);

        setExtensionComponents(
          extensions.map(extension => {
            extension.init({
              notebookId: id,
              commands: features.commands,
              panel: thisPanel!,
            });
            extension.createNew(thisPanel!, context);
            return extension.component ?? <></>;
          })
        );

        //-- Add ipywidgets renderer
        const notebookRenderers = thisPanel.content.rendermime;
        widgetsManager = new WidgetManager(context, notebookRenderers, {
          saveState: false,
        });
        notebookRenderers.addFactory(
          {
            safe: true,
            mimeTypes: [WIDGET_MIMETYPE],
            defaultRank: 1,
            createRenderer: options =>
              new WidgetLabRenderer(options, widgetsManager!),
          },
          1
        );
        for (const cell of thisPanel.content.widgets) {
          if (cell.model.type === 'code') {
            for (const codecell of (cell as CodeCell).outputArea.widgets) {
              for (const output of Array.from(codecell.children())) {
                if (output instanceof WidgetLabRenderer) {
                  output.manager = widgetsManager;
                }
              }
            }
          }
        }

        setIsLoading(false);
      }
    }
    setPanel(thisPanel);
    if (!thisPanel) {
      setExtensionComponents([]);
      setAdapter(null);
    }

    return () => {
      widgetsManager?.dispose();
      if (thisAdapter) {
        thisAdapter.dispose();
      }
      if (thisPanel) {
        if (thisPanel.content) {
          Signal.clearData(thisPanel.content);
        }
        try {
          thisPanel.dispose();
        } catch (reason) {
          // No-op
        }
      }
      setPanel(panel => (panel === thisPanel ? null : panel));
      setAdapter(adapter => (adapter === thisAdapter ? null : adapter));
    };
  }, [context, extensions, features.commands, widgetFactory]);

  // Update notebook store when adapter changes
  useEffect(() => {
    if (adapter) {
      const currentNotebooks = notebookStore2.getState().notebooks;
      const updatedNotebooks = new Map(currentNotebooks);
      updatedNotebooks.set(id, { adapter });
      notebookStore2.getState().setNotebooks2(updatedNotebooks);
    } else {
      const currentNotebooks = notebookStore2.getState().notebooks;
      if (currentNotebooks.has(id)) {
        const updatedNotebooks = new Map(currentNotebooks);
        updatedNotebooks.delete(id);
        notebookStore2.getState().setNotebooks2(updatedNotebooks);
      }
    }
  }, [adapter, id]);

  useEffect(() => {
    let isMounted = true;
    let onActiveCellChanged:
      | ((notebook: Notebook, cell: Cell<ICellModel> | null) => void)
      | null = null;
    let onSessionChanged:
      | ((
          _: ISessionContext,
          changes: IChangedArgs<
            ISessionConnection | null,
            ISessionConnection | null,
            'session'
          >
        ) => void)
      | null = null;
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
        onActiveCellChanged = (
          notebook: Notebook,
          cell: Cell<ICellModel> | null
        ) => {
          if (cell) {
            cell.ready.then(() => {
              completer.editor = cell?.editor;
            });
          }
        };
        onSessionChanged = (
          _: ISessionContext,
          changes: IChangedArgs<
            ISessionConnection | null,
            ISessionConnection | null,
            'session'
          >
        ) => {
          if (!isMounted) {
            return;
          }
          const editor = panel.content.activeCell?.editor;
          const provider = new KernelCompleterProvider();
          const reconciliator = new ProviderReconciliator({
            context: {
              widget: panel,
              editor,
              session: changes.newValue,
            },
            providers: [provider],
            timeout: COMPLETER_TIMEOUT_MILLISECONDS,
          });
          completer.editor = editor;
          completer.reconciliator = reconciliator;
        };
        panel.context.sessionContext.sessionChanged.connect(onSessionChanged);
        panel.context.sessionContext.ready.then(() => {
          onSessionChanged?.(panel.context.sessionContext, {
            name: 'session',
            oldValue: null,
            newValue: panel.context.sessionContext.session,
          });
        });
        panel.content.activeCellChanged.connect(onActiveCellChanged);
      }
    }

    return () => {
      isMounted = false;
      // Reset the completer
      if (completer) {
        if (onActiveCellChanged) {
          panel?.content.activeCellChanged.disconnect(onActiveCellChanged);
        }
        if (onSessionChanged) {
          panel?.context.sessionContext.sessionChanged.connect(
            onSessionChanged
          );
        }
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

  useEffect(() => {
    const onKeyDown = (event: any) => {
      features.commands.processKeydownEvent(event);
    };
    // FIXME It would be better to add the listener to the Box wrapping the panel
    // but this requires the use of the latest version of JupyterLab/Lumino that
    // capture event at bubbling phase for keyboard shortcuts rather than at capture phase.
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [features.commands]);

  // Cleanup notebook from store on unmount
  useEffect(() => {
    return () => {
      const currentNotebooks = notebookStore2.getState().notebooks;
      if (currentNotebooks.has(id)) {
        const updatedNotebooks = new Map(currentNotebooks);
        updatedNotebooks.delete(id);
        notebookStore2.getState().setNotebooks2(updatedNotebooks);
      }
    };
  }, [id]);

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
        <Box sx={{ height: '100%' }}>
          <Lumino id={id} key="notebook-container">
            {panel}
          </Lumino>
        </Box>
      ) : (
        <Banner
          key="notebook-error"
          variant="critical"
          description="Unable to create the notebook view."
          hideTitle
          title="Error"
        />
      )}
    </>
  );
}

/**
 * Get the kernel ID to connect to.
 *
 * Steps:
 * - Check the requested kernel ID exists
 * - If no kernel found, start a new one if required
 *
 * Note
 * If the hook starts the kernel, it will shut it down when unmounting.
 */
export function useKernelId(
  options:
    | {
        /**
         * Kernels manager
         */
        kernels?: Kernel.IManager;
        /**
         * Kernel ID to connect to
         *
         * If the kernel does not exist and {@link startDefaultKernel} is `true`,
         * another kernel will be started.
         */
        requestedKernelId?: string;
        /**
         * Whether or not to start a default kernel.
         *
         * Default: false
         */
        startDefaultKernel?: boolean;
      }
    | undefined = {}
): string | undefined {
  const { kernels, requestedKernelId, startDefaultKernel = false } = options;

  // Define the kernel to be used.
  // - Check the provided kernel id exists
  // - If no kernel found, start a new one if required
  const [kernelId, setKernelId] = useState<string | undefined>(undefined);
  useEffect(() => {
    let isMounted = true;
    let connection: Kernel.IKernelConnection | undefined;
    if (kernels) {
      (async () => {
        let newKernelId: string | undefined;
        await kernels.ready;
        if (requestedKernelId) {
          for (const model of kernels.running()) {
            if (model.id === requestedKernelId) {
              newKernelId = requestedKernelId;
              break;
            }
          }
        }

        if (!newKernelId && startDefaultKernel && isMounted) {
          console.log('Starting new kernel.');
          connection = await kernels.startNew();
          if (isMounted) {
            newKernelId = connection.id;
          } else {
            connection.dispose();
          }
        }

        if (isMounted) {
          setKernelId(newKernelId);
        }
      })();
    }

    return () => {
      isMounted = false;
      if (connection) {
        // A new kernel was started
        console.log(`Shutting down kernel '${connection.id}'.`);
        connection
          .shutdown()
          .catch(reason => {
            console.warn(
              `Failed to shutdown kernel '${connection?.id}'.`,
              reason
            );
          })
          .finally(() => {
            connection?.dispose();
          });
      }
    };
  }, [kernels, requestedKernelId, startDefaultKernel]);

  return kernelId;
}

type IOptions = {
  /**
   * Collaboration provider for the notebook.
   */
  collaborationProvider?: ICollaborationProvider;
  /**
   * Notebook content.
   */
  nbformat?: INotebookContent;
  /**
   * Whether the model is read-only or not.
   *
   * Default: false
   */
  readonly?: boolean;
  /**
   * URL to fetch the notebook content from.
   */
  url?: string;
  /**
   * Path to the notebook file.
   */
  path?: string;
  /**
   * Service manager.
   */
  serviceManager?: ServiceManager.IManager;
  /**
   * Notebook ID.
   */
  id?: string;
};

/**
 * Hook to handle a notebook model.
 *
 * The notebook content may come from 3 sources:
 * - {@link nbformat}: The notebook content
 * - {@link url}: A URL to fetch the notebook content from
 * - {@link collaborationProvider}: A collaboration provider for real-time editing
 */
export function useNotebookModel(options: IOptions): NotebookModel | null {
  const {
    collaborationProvider,
    nbformat,
    readonly = false,
    url,
    path,
    serviceManager,
    id,
  } = options;

  // Generate the notebook model
  // There are three posibilities (by priority order):
  // - Connection to a collaborative document
  // - Provided notebook content
  // - Provided URL to fetch notebook content from
  const [model, setModel] = useState<NotebookModel | null>(null);

  useEffect(() => {
    let isMounted = true;
    const disposable = new DisposableSet();

    // Handle new collaboration provider
    if (collaborationProvider && serviceManager && id) {
      const setupCollaboration = async () => {
        try {
          const sharedModel = new YNotebook();

          // Connect to the collaboration provider
          await collaborationProvider.connect(sharedModel, id, {
            serviceManager,
            path,
          });

          if (isMounted) {
            const model = new NotebookModel({
              collaborationEnabled: true,
              disableDocumentWideUndoRedo: true,
              sharedModel,
            });
            model.readOnly = readonly;
            setModel(model);

            disposable.add({
              dispose: () => {
                collaborationProvider.disconnect();
              },
              get isDisposed() {
                return false;
              },
            });
          }
        } catch (error) {
          console.error('Failed to setup collaboration:', error);
        }
      };

      setupCollaboration();
    } else {
      const createModel = (nbformat: INotebookContent | undefined) => {
        const model = new NotebookModel();
        if (nbformat) {
          nbformat.cells.forEach(cell => {
            cell.metadata['editable'] = !readonly;
          });
          model.fromJSON(nbformat);
        }
        model.readOnly = readonly;
        setModel(model);
      };

      if (!nbformat && url) {
        loadFromUrl(url).then(nbformat => {
          if (isMounted) {
            createModel(nbformat);
          }
        });
      } else {
        createModel(nbformat);
      }
    }

    return () => {
      isMounted = false;
      disposable.dispose();
    };
  }, [
    collaborationProvider,
    nbformat,
    readonly,
    url,
    path,
    serviceManager,
    id,
  ]);

  return model;
}

async function loadFromUrl(url: string) {
  return fetch(url)
    .then(response => {
      return response.text();
    })
    .then(nb => {
      return JSON.parse(nb);
    });
}

/**
 * Common immutable JupyterLab features required for the notebook panel.
 */
class CommonFeatures {
  protected _commands: CommandRegistry;
  protected _editorServices: IEditorServices;
  protected _rendermime: RenderMimeRegistry;

  constructor(
    options: {
      commands?: CommandRegistry;
      renderers?: IRenderMime.IRendererFactory[];
    } = {}
  ) {
    this._commands = options.commands ?? new CommandRegistry();

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

    const initialFactories = standardRendererFactories
      .filter(factory => factory.mimeTypes[0] !== 'text/javascript')
      .concat([jsonRendererFactory, javascriptRendererFactory])
      .concat(options.renderers ?? []);

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

    const editorExtensions = new EditorExtensionRegistry();
    for (const extensionFactory of EditorExtensionRegistry.getDefaultExtensions(
      { themes }
    )) {
      editorExtensions.addExtension(extensionFactory);
    }
    editorExtensions.addExtension({
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
    editorExtensions.addExtension({
      name: 'remote-user-cursors',
      factory(options) {
        const { awareness, ysource: ytext } = options.model.sharedModel as any;
        return EditorExtensionRegistry.createImmutableExtension(
          remoteUserCursors({ awareness, ytext })
        );
      },
    });
    // Fix to deal with Content Security Policy
    const nonce = getNonce();
    if (nonce) {
      editorExtensions.addExtension({
        name: 'csp-nonce',
        factory() {
          return EditorExtensionRegistry.createImmutableExtension(
            EditorView.cspNonce.of(nonce)
          );
        },
      });
    }

    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions,
      languages: languages,
    });
    this._editorServices = {
      factoryService,
      mimeTypeService,
    };
  }

  get commands(): CommandRegistry {
    return this._commands;
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
  onSessionConnection?: OnSessionConnection,
  serverLess: boolean = false
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

      if (!serverLess) {
        // Note: we don't wait on the session to initialize
        // so that the user can be shown the content before
        // any kernel has started.
        void context.sessionContext
          .initialize()
          .then((shouldSelect: boolean) => {
            if (shouldSelect) {
              void (context as any)._dialogs.selectKernel(
                (context!.sessionContext as any).sessionContext
              );
            }
          });
      }
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
  });

  // Initialize the context
  context.initialize(path ? false : true);
}

/**
 * Service manager facade for missing manager.
 */
class NoServiceManager {
  readonly contents = Object.freeze({
    fileChanged: { connect: () => {} },
    getSharedModelFactory(path: string): null {
      return null;
    },
    localPath(path: string): string {
      const parts = path.split('/');
      const firstParts = parts[0].split(':');
      if (
        firstParts.length === 1 ||
        !this._additionalDrives.has(firstParts[0])
      ) {
        return PathExt.removeSlash(path);
      }
      return PathExt.join(firstParts.slice(1).join(':'), ...parts.slice(1));
    },
    normalize(path: string): string {
      const parts = path.split(':');
      if (parts.length === 1) {
        return PathExt.normalize(path);
      }
      return `${parts[0]}:${PathExt.normalize(parts.slice(1).join(':'))}`;
    },
  });

  readonly kernelspecs = Object.freeze({
    // Ever hanging promise.
    ready: new Promise(() => {}),
  });

  readonly sessions = Object.freeze({
    // Ever hanging promise.
    ready: new Promise(() => {}),
  });

  // Always ready otherwise the spinner in the MainAreaWidget won't be discarded.
  readonly ready = Promise.resolve();
}

/**
 * Returns the nonce used in the page, if any.
 *
 * Based on https://github.com/cssinjs/jss/blob/master/packages/jss/src/DomRenderer.js
 */
function getNonce() {
  const node = document.querySelector('meta[property="csp-nonce"]');
  if (node) {
    return node.getAttribute('content');
  } else {
    return null;
  }
}
