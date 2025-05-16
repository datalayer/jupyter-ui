import { NotebookPanel } from '@jupyterlab/notebook';
import { TocLayoutFactory } from './TocExtension';
import { TableOfContents, TableOfContentsPanel } from '@jupyterlab/toc';
import { BoxPanel } from '@lumino/widgets';

/**
 * Jupyter ToC Layout Factory.
 * Insert ToC Panel into (Lumino) notebook BoxPanel. (Default: left side and 50% stretch)
 */
export class JupyterLayoutFactory implements TocLayoutFactory {
  private _tocPanel: TableOfContentsPanel;
  private _config: Record<string, any>;

  constructor(config?: Record<string, any>) {
    this._config = config ?? {};
    this._tocPanel = new TableOfContentsPanel();
  }

  layout(panel: BoxPanel, notebookPanel: NotebookPanel, notebookId: string) {
    panel.direction = this._config?.direction ?? 'left-to-right';
    panel.insertWidget(this._config?.index ?? 1, this._tocPanel);
    BoxPanel.setStretch(this._tocPanel, this._config?.stretch ?? 0);
    BoxPanel.setSizeBasis(this._tocPanel, this._config?.sizeBasis ?? 0);
    return null;
  }

  setModel(model: TableOfContents.Model) {
    this._tocPanel.model = model;
  }

  dispose() {
    this._tocPanel.dispose();
  }
}
