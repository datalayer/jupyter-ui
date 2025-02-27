import { ReactWidget } from '@jupyterlab/apputils';
import type { Cell, ICellModel } from '@jupyterlab/cells';
import type { CellList, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import type { IObservableList } from '@jupyterlab/observables';
import type { CommandRegistry } from '@lumino/commands';
import type { IDisposable } from '@lumino/disposable';
import { Signal } from '@lumino/signaling';
import type { PanelLayout, Widget } from '@lumino/widgets';
import type React from 'react';
import { JupyterReactTheme } from '../../../../theme';
import type {
  DatalayerNotebookExtension,
  IDatalayerNotebookExtensionProps,
} from '../../Notebook';
import { CellSidebar, type ICellSidebarProps } from './CellSidebar';

class CellSidebarFactory implements IDisposable {
  private _isDisposed = false;
  private _sidebars = new WeakMap<ICellModel, Widget>();

  /**
   * Cell sidebar factory.
   *
   * @param panel The notebook panel
   * @param commands Command registry
   * @param ngrader Whether to activate nbgrader feature or not.
   */
  constructor(
    protected panel: NotebookPanel,
    protected commands: CommandRegistry,
    protected nbgrader: boolean = false,
    protected sidebarWidth: number = 120
  ) {
    this._onModelChanged(panel.content);
    panel.content.modelChanged.connect(this._onModelChanged, this);
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }

    this._isDisposed = true;
    this.panel.content.model?.cells.changed.disconnect(
      this._onCellsChanged,
      this
    );
    this.panel.content.modelChanged.disconnect(this._onModelChanged, this);
    Signal.clearData(this);
  }

  private _addSidebar(model: ICellModel): void {
    const cell = this._getCell(model);
    if (cell) {
      const sidebar = ReactWidget.create(
        <JupyterReactTheme>
          <CellSidebar
            commands={this.commands}
            model={model}
            nbgrader={this.nbgrader}
          />
        </JupyterReactTheme>
      );
      // Position sidebar wrapper
      sidebar.node.style.width = `${this.sidebarWidth}px`;
      sidebar.node.style.position = 'absolute';
      sidebar.node.style.right = `-${this.sidebarWidth}px`;
      sidebar.node.style.top = '0';
      (cell.layout as PanelLayout).insertWidget(0, sidebar);
      this._sidebars.set(model, sidebar);
      const removeSidebar = () => {
        this._sidebars.delete(model);
        sidebar.dispose();
      };
      cell.disposed.connect(removeSidebar);
    }
  }

  private _getCell(model: ICellModel): Cell | undefined {
    return this.panel?.content.widgets.find(widget => widget.model === model);
  }

  private _removeSidebar(model: ICellModel): void {
    this._sidebars.get(model)?.dispose();
    this._sidebars.delete(model);
  }

  private _onCellsChanged(
    cells: CellList,
    changed: IObservableList.IChangedArgs<ICellModel>
  ): void {
    changed.oldValues.forEach(model => this._removeSidebar(model));
    changed.newValues.forEach(model => this._addSidebar(model));
  }

  private _onModelChanged(content: Notebook): void {
    const cells = content.model?.cells;
    if (cells) {
      this._onCellsChanged(cells, {
        type: 'add',
        newIndex: 0,
        newValues: Array.from(cells),
        oldIndex: -1,
        oldValues: [],
      });
    }
    cells?.changed.connect(this._onCellsChanged, this);
  }
}

/**
 * Cell sidebar extension for notebook panels.
 */
export class CellSidebarExtension implements DatalayerNotebookExtension {
  protected factory: React.JSXElementConstructor<ICellSidebarProps>;
  protected commands?: CommandRegistry;
  protected nbgrader?: boolean;
  protected sidebarWidth?: number;

  /**
   * Constructor
   *
   * @param commands Command registry
   * @param factory Cell sidebar React component factory
   * @param nbgrader Whether to activate nbgrader feature or not.
   */
  constructor(
    options: {
      commands?: CommandRegistry;
      factory?: React.JSXElementConstructor<ICellSidebarProps>;
      nbgrader?: boolean;
      sidebarWidth?: number;
    } = {}
  ) {
    this.factory = options.factory ?? CellSidebar;
    this.commands = options.commands;
    this.nbgrader = options.nbgrader;
    this.sidebarWidth = options.sidebarWidth;
  }

  readonly component: null;

  createNew(panel: NotebookPanel): IDisposable {
    // We assume the extension was either created within JupyterLab passing
    // the app commands registry or through Datalayer workflow that set it
    // when calling `init`.
    const sidebar = new CellSidebarFactory(
      panel,
      this.commands!,
      this.nbgrader,
      this.sidebarWidth
    );
    return sidebar;
  }

  init(props: IDatalayerNotebookExtensionProps): void {
    this.commands = props.commands;
  }
}
