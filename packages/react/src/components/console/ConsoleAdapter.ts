import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
import { CommandRegistry } from '@lumino/commands';
import { CodeMirrorEditorFactory, CodeMirrorMimeTypeService, EditorLanguageRegistry, EditorExtensionRegistry, ybinding } from '@jupyterlab/codemirror';
import { BoxPanel } from '@lumino/widgets';
import { ServiceManager } from '@jupyterlab/services';
import { ConsolePanel } from '@jupyterlab/console';
import { IYText } from '@jupyter/ydoc';

class ConsoleAdapter {
  private consolePanel: BoxPanel;

  constructor(lite: boolean, serviceManager: ServiceManager) {
    this.consolePanel = new BoxPanel();
    this.consolePanel.direction = 'top-to-bottom';
    this.consolePanel.spacing = 0;
    this.consolePanel.addClass('dla-JupyterLab-Console');
    serviceManager.ready.then(() => {
      this.startConsole('console-path', serviceManager, this.consolePanel);
    });
  }

  startConsole(
    path: string,
    serviceManager: ServiceManager.IManager,
    panel: BoxPanel
  ) {
    const commands = new CommandRegistry();    
    document.addEventListener('keydown', event => {
      commands.processKeydownEvent(event);
    });
    const rendermime = new RenderMimeRegistry({ initialFactories });
    const editorExtensions = () => {
      const registry = new EditorExtensionRegistry();
      for (const extensionFactory of EditorExtensionRegistry.getDefaultExtensions({})) {
        registry.addExtension(extensionFactory);
      }
      registry.addExtension({
        name: 'yjs-binding',
        factory: options => {
          const sharedModel = options.model.sharedModel as IYText;
          return EditorExtensionRegistry.createImmutableExtension(
            ybinding({
              ytext: sharedModel.ysource,
              undoManager: sharedModel.undoManager ?? undefined
            })
          );
        }
      });
      return registry;
    }
    const languages = new EditorLanguageRegistry();
    EditorLanguageRegistry.getDefaultLanguages()
      .filter(language =>
        ['ipython', 'julia', 'python'].includes(language.name.toLowerCase())
      )
      .forEach(language => {
        languages.addLanguage(language);
      });
    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages
    });
    const mimeTypeService = new CodeMirrorMimeTypeService(languages);
    const editorFactory = factoryService.newInlineEditor;
    const contentFactory = new ConsolePanel.ContentFactory({ editorFactory });
    const consolePanel = new ConsolePanel({
      manager: serviceManager,
      rendermime,
      path,
      contentFactory,
      mimeTypeService,
      kernelPreference: {
        shouldStart: true,
        name: 'python3',
      }
    });
    consolePanel.title.label = 'Console';
    BoxPanel.setStretch(consolePanel, 1);
    panel.addWidget(consolePanel);
    window.addEventListener('resize', () => {
      panel.update();
    });
    const selector = '.jp-ConsolePanel';
    let command: string;
    command = 'console:clear';
    commands.addCommand(command, {
      label: 'Clear',
      execute: () => {
        consolePanel.console.clear();
      }
    });
    command = 'console:execute';
    commands.addCommand(command, {
      label: 'Execute Prompt',
      execute: () => {
        return consolePanel.console.execute();
      }
    });
    commands.addKeyBinding({ command, selector, keys: ['Enter'] });
    command = 'console:execute-forced';
    commands.addCommand(command, {
      label: 'Execute Cell (forced)',
      execute: () => {
        return consolePanel.console.execute(true);
      }
    });
    commands.addKeyBinding({ command, selector, keys: ['Shift Enter'] });
    command = 'console:linebreak';
    commands.addCommand(command, {
      label: 'Insert Line Break',
      execute: () => {
        consolePanel.console.insertLinebreak();
      }
    });
    commands.addKeyBinding({ command, selector, keys: ['Ctrl Enter'] });    
  }

  get panel(): BoxPanel {
    return this.consolePanel;
  }

}

export default ConsoleAdapter;
