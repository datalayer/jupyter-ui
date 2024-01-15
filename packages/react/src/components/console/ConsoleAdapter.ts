/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { BoxPanel } from '@lumino/widgets';
import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories,
} from '@jupyterlab/rendermime';
import {
  ybinding,
  CodeMirrorEditorFactory,
  CodeMirrorMimeTypeService,
  EditorLanguageRegistry,
  EditorExtensionRegistry,
  EditorThemeRegistry,
} from '@jupyterlab/codemirror';
import { ServiceManager } from '@jupyterlab/services';
import { ConsolePanel } from '@jupyterlab/console';
import { IYText } from '@jupyter/ydoc';
import { Kernel } from '../../jupyter/kernel';

const DEFAULT_CONSOLE_PATH = 'console-path';

class ConsoleAdapter {
  private _panel: BoxPanel;
  private _code?: string[];

  constructor(options: ConsoleAdapter.IConsoleAdapterOptions) {
    const { kernel, serviceManager, code } = options;
    this._code = code;
    this._panel = new BoxPanel();
    this._panel.direction = 'top-to-bottom';
    this._panel.spacing = 0;
    this._panel.addClass('dla-JupyterLab-Console');
    Promise.all([serviceManager.ready, kernel?.ready]).then(() => {
      this.setupConsole(serviceManager, kernel);
    });
  }

  protected setupConsole(serviceManager: ServiceManager, kernel?: Kernel) {
    // Set up a command registry.
    const commands = new CommandRegistry();
    this._panel.node.addEventListener('keydown', event => {
      commands.processKeydownEvent(event);
    });

    // Set up the text editor
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
    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages,
    });
    const rendermime = new RenderMimeRegistry({ initialFactories });
    const mimeTypeService = new CodeMirrorMimeTypeService(languages);
    const editorFactory = factoryService.newInlineEditor;

    const contentFactory = new ConsolePanel.ContentFactory({ editorFactory });

    const consolePanel = new ConsolePanel({
      name: kernel?.session.name,
      manager: serviceManager,
      rendermime,
      path: kernel?.session.path ?? DEFAULT_CONSOLE_PATH,
      contentFactory,
      mimeTypeService,
      kernelPreference: {
        shouldStart: true,
        name: kernel?.connection?.name ?? 'python',
        id: kernel?.id,
        language: kernel?.info?.language_info.name,
      },
    });

    consolePanel.title.label = 'Console';
    BoxPanel.setStretch(consolePanel, 1);
    this._panel.addWidget(consolePanel);

    window.addEventListener('resize', () => {
      this._panel.update();
    });

    const selector = '.jp-ConsolePanel';

    // Add Console commands.
    let command: string;
    command = 'console:clear';
    commands.addCommand(command, {
      label: 'Clear',
      execute: () => {
        consolePanel.console.clear();
      },
    });
    command = 'console:execute';
    commands.addCommand(command, {
      label: 'Execute Prompt',
      execute: () => {
        return consolePanel.console.execute();
      },
    });
    commands.addKeyBinding({ command, selector, keys: ['Enter'] });
    command = 'console:execute-forced';
    commands.addCommand(command, {
      label: 'Execute Cell (forced)',
      execute: () => {
        return consolePanel.console.execute(true);
      },
    });
    commands.addKeyBinding({ command, selector, keys: ['Shift Enter'] });
    command = 'console:linebreak';
    commands.addCommand(command, {
      label: 'Insert Line Break',
      execute: () => {
        consolePanel.console.insertLinebreak();
      },
    });
    commands.addKeyBinding({ command, selector, keys: ['Ctrl Enter'] });

    if (this._code) {
      consolePanel.console.sessionContext.ready.then(() => {
        this._code!.forEach(line => consolePanel.console.inject(line));
      });
    }
  }

  get panel(): BoxPanel {
    return this._panel;
  }
}

export namespace ConsoleAdapter {
  /**
   * Console adapter options
   */
  export interface IConsoleAdapterOptions {
    /**
     * Default kernel
     */
    kernel?: Kernel;
    /**
     * Application service manager
     */
    serviceManager: ServiceManager;
    /**
     * Initial code to run.
     */
    code?: string[];
  }
}

export default ConsoleAdapter;
