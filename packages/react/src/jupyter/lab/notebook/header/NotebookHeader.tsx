import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { ReactWidget } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ThemeProvider, BaseStyles, IconButton, Box } from '@primer/react';
import { JupyterBaseIcon as JupyterClassicRenderIcon, DashboardIcon as DashboardIcon } from '@datalayer/icons-react'
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { CLASSIC_RENDER_WIDGET_FACTORY } from './../classic/plugin';
import { DASHBOARD_WIDGET_FACTORY } from './../dashboard/plugin';

class NotebookHeader extends ReactWidget {
  private _panel: NotebookPanel
  private _commands: CommandRegistry;

  constructor(panel: NotebookPanel, commands: CommandRegistry) {
    super();
    this._panel = panel;
    this._commands = commands;
  }

  renderClassic() {
    this._commands.execute('docmanager:open', {
      path: this._panel.context.path,
      factory: CLASSIC_RENDER_WIDGET_FACTORY,
      options: {
        mode: 'split-right'
      }
    });
  }

  showDashboard() {
    this._commands.execute('docmanager:open', {
      path: this._panel.context.path,
      factory: DASHBOARD_WIDGET_FACTORY,
      options: {
        mode: 'split-right'
      }
    });
  }

  render() {
    return (
      <ThemeProvider>
        <BaseStyles>
          <Box m={3}>
            <IconButton 
              aria-label="Classic Render"
              icon={() => <JupyterClassicRenderIcon colored/>}
              size="medium"
              title="Render the classic way"
              onClick={e => { e.preventDefault(); this.renderClassic()}}
            />
            <IconButton
              aria-label="Edit as a Dashboard"
              icon={() => <DashboardIcon colored/>}
              size="medium"
              title="Edit as a Dashboard"
              onClick={e => { e.preventDefault(); this.showDashboard()}}
              sx={{ml: 3}}
            />
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
