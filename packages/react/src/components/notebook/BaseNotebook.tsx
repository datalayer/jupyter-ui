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
} from '@jupyterlab/notebook';
import {
  RenderMimeRegistry,
  standardRendererFactories,
} from '@jupyterlab/rendermime';
import type {
  Contents,
  ServiceManager,
  SessionManager,
} from '@jupyterlab/services';
import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { Banner } from '@primer/react/experimental';
import { useEffect, useMemo, useState } from 'react';
import { newUuid } from '../../utils';
import { Lumino } from '../lumino';
import { Loader } from '../utils';
import { JupyterReactContentFactory } from './content';

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
   * Kernel ID to connect to
   */
  kernelId?: string;
  /**
   * Service manager
   */
  manager: ServiceManager.IManager;
  /**
   * Notebook content model
   */
  model: NotebookModel;
  /**
   * Notebook path
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
  const { kernelId, manager, model } = props;
  const [isLoading, setIsLoading] = useState(true);

  const id = useMemo(() => props.id || newUuid(), [props.id]);
  const path = useMemo(
    () => props.path || FALLBACK_NOTEBOOK_PATH,
    [props.path]
  );
  // Features are not disposable
  const features = useMemo(() => new CommonFeatures(), []);

  // tracker is disposable
  const [tracker, setTracker] = useState<NotebookTracker | null>(null);
  useEffect(() => {
    const thisTracker = new NotebookTracker({ namespace: id });
    setTracker(thisTracker);

    // FIXME add commands

    return () => {
      // FIXME remove commands

      thisTracker.dispose();
      setTracker(tracker => (tracker === thisTracker ? null : tracker));
    };
  }, [id]);

  const contentFactory = useMemo(
    () =>
      // FIXME missing nbgrader and CellSidebar
      new JupyterReactContentFactory(id, false, features.commandRegistry, {
        editorFactory: features.editorServices.factoryService.newInlineEditor,
      }),
    [id, features]
  );

  const [context, setContext] = useState<Context<NotebookModel> | null>(null);
  useEffect(() => {
    const factory = new DummyModelFactory(model);
    const thisContext = new Context<NotebookModel>({
      factory,
      manager,
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
      path !== FALLBACK_NOTEBOOK_PATH ? path : undefined
    );

    setContext(thisContext);

    return () => {
      thisContext.dispose();
      factory.dispose();
      setContext(context => (context === thisContext ? null : context));
    };
  }, [id, manager, model, path]);

  useEffect(() => {
    if (context && kernelId) {
      context.sessionContext.changeKernel({ id: kernelId });
    }
  }, [context, kernelId]);

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

  const [panel, setPanel] = useState<NotebookPanel | null>(null);
  useEffect(() => {
    let thisPanel: NotebookPanel | null = null;
    if (context) {
      thisPanel = widgetFactory?.createNew(context) ?? null;
      setPanel(thisPanel);
      if (thisPanel) {
        setIsLoading(false);
      }
    } else {
      setPanel(null);
    }
    return () => {
      try {
        thisPanel?.dispose();
      } catch (reason) {}
      setPanel(panel => (panel === thisPanel ? null : panel));
    };
  }, [widgetFactory, context, features]);

  useEffect(() => {
    if (panel && tracker) {
      tracker.add(panel).catch(reason => {
        console.error(`Failed to track the notebook panel '${id}'.`);
      });
    }
  }, [panel, tracker]);

  // FIXME
  // - add the completer
  // - add keyboard shortcut listener
  // - add ipywidgets
  // - connect signals - see adapter

  return isLoading ? (
    <Loader />
  ) : panel ? (
    <Lumino id={id}>{panel}</Lumino>
  ) : (
    <Banner
      variant="critical"
      description="Unable to create the notebook view."
      hideTitle={true}
    />
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

function initializeContext(context: Context, id: string, path?: string) {
  const shuntContentManager = path ? false : true;

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
        path: path ?? FALLBACK_NOTEBOOK_PATH,
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
  context.initialize(path ? false : true);
}
