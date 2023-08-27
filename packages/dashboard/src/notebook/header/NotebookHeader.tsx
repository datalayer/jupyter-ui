import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { ReactWidget } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ThemeProvider, BaseStyles, Button, Box } from '@primer/react';
import { JupyterBaseIcon, DashboardGreenIcon, EyesIcon } from '@datalayer/icons-react'
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { CLASSIC_RENDER_WIDGET_FACTORY } from './../classic/plugin';
import { VIEWER_WIDGET_FACTORY } from './../viewer/plugin';

class NotebookHeader extends ReactWidget {
  private _panel: NotebookPanel
  private _commands: CommandRegistry;

  constructor(panel: NotebookPanel, commands: CommandRegistry) {
    super();
    this._panel = panel;
    this._commands = commands;
  }

  showClassicRender() {
    this._commands.execute('docmanager:open', {
      path: this._panel.context.path,
      factory: CLASSIC_RENDER_WIDGET_FACTORY,
      options: {
        mode: 'split-right'
      }
    });
  }

  showViewer() {
    this._commands.execute('docmanager:open', {
      path: this._panel.context.path,
      factory: VIEWER_WIDGET_FACTORY,
      options: {
        mode: 'split-right'
      }
    });
  }

  showDashboard() {
    this._commands.execute('docmanager:open', {
      path: this._panel.context.path.replace('.ipynb', '.dash'),
      factory: 'dashboard',
      options: {
        mode: 'split-right'
      }
    });
  }

  render() {
    return (
      <ThemeProvider>
        <BaseStyles>
          <Box m={3} sx={{display: 'flex', flexGrow: 1}}>
            <Box sx={{flexGrow: 1}}></Box>
            <Box>
              <Button
                aria-label="Classic Render"
                title="Render the classic way"
                size="small"
                variant="invisible"
                leadingVisual={() => <JupyterBaseIcon colored/>}
                onClick={e => { e.preventDefault(); this.showClassicRender()}}
              >
                View classic
              </Button>
            </Box>
            <Box sx={{ml: 3}}>
              <Button
                aria-label="View"
                title="View"
                size="small"
                variant="invisible"
                leadingVisual={() => <EyesIcon colored/>}
                onClick={e => { e.preventDefault(); this.showViewer()}}                
              >
                View static
              </Button>
            </Box>
            <Box sx={{ml: 3}}>
              <Button
                aria-label="Publish as a Dashboard"
                title="Publish as a Dashboard"
                size="small"
                leadingVisual={() => <DashboardGreenIcon colored/>}
                onClick={e => { e.preventDefault(); this.showDashboard()}}
              >
                Publish
              </Button>
            </Box>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    );
  }

}

export class NotebookHeaderExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private _commands: CommandRegistry;

  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  createNew(panel: NotebookPanel, _: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    const notebookHeader = new NotebookHeader(panel, this._commands);
    notebookHeader.addClass('dla-NotebookPanel-header');
    panel.contentHeader.insertWidget(0, notebookHeader);
    return new DisposableDelegate(() => {
      notebookHeader.dispose();
    });

  }

}
