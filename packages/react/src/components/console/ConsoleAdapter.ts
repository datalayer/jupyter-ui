import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
import { CommandRegistry } from '@lumino/commands';
import { BoxPanel } from '@lumino/widgets';
import { ServiceManager } from '@jupyterlab/services';
import { editorServices } from '@jupyterlab/codemirror';
import { ConsolePanel } from '@jupyterlab/console';

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
    const editorFactory = editorServices.factoryService.newInlineEditor;
    const contentFactory = new ConsolePanel.ContentFactory({ editorFactory });
    const console = new ConsolePanel({
      rendermime,
      manager: serviceManager,
      path,
      contentFactory,
      mimeTypeService: editorServices.mimeTypeService,
      kernelPreference: {
        shouldStart: true,
        name: 'python3',
      }
    });
    console.title.label = 'Console';
    BoxPanel.setStretch(console, 1);
    panel.addWidget(console);
    window.addEventListener('resize', () => {
      panel.update();
    });
    const selector = '.jp-ConsolePanel';
    let command: string;
    command = 'console:clear';
    commands.addCommand(command, {
      label: 'Clear',
      execute: () => {
        console.console.clear();
      }
    });
    command = 'console:execute';
    commands.addCommand(command, {
      label: 'Execute Prompt',
      execute: () => {
        return console.console.execute();
      }
    });
    commands.addKeyBinding({ command, selector, keys: ['Enter'] });
    command = 'console:execute-forced';
    commands.addCommand(command, {
      label: 'Execute Cell (forced)',
      execute: () => {
        return console.console.execute(true);
      }
    });
    commands.addKeyBinding({ command, selector, keys: ['Shift Enter'] });
    command = 'console:linebreak';
    commands.addCommand(command, {
      label: 'Insert Line Break',
      execute: () => {
        console.console.insertLinebreak();
      }
    });
    commands.addKeyBinding({ command, selector, keys: ['Ctrl Enter'] });    
  }

  get panel(): BoxPanel {
    return this.consolePanel;
  }

}

export default ConsoleAdapter;
