/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import type { Cell, ICellModel } from '@jupyterlab/cells';
import type { CellList, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import type { IObservableList } from '@jupyterlab/observables';
import type { CommandRegistry } from '@lumino/commands';
import type { IDisposable } from '@lumino/disposable';
import type { PanelLayout, Widget } from '@lumino/widgets';
import { Signal } from '@lumino/signaling';
import { JupyterReactTheme, Colormode } from '../../../../theme';
import { CellSidebar, type ICellSidebarProps } from './CellSidebar';
import {
  NotebookExtension,
  INotebookExtensionProps,
} from '../../NotebookExtensions';

class CellSidebarFactory implements IDisposable {
  private _isDisposed = false;
  private _sidebars = new WeakMap<ICellModel, Widget>();

  /**
   * Cell sidebar factory.
   *
   * @param panel The notebook panel
   * @param commands Command registry
   * @param ngrader Whether to activate nbgrader feature or not.
   * @param sidebarWidth Width of the sidebar
   * @param factory React component factory
   * @param colormode Color mode for the theme
   */
  constructor(
    protected panel: NotebookPanel,
    protected commands: CommandRegistry,
    protected nbgrader: boolean = false,
    protected sidebarWidth: number = 120,
    protected factory: React.JSXElementConstructor<ICellSidebarProps> = CellSidebar,
    protected colormode: Colormode = 'light'
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
      const SidebarFactory = this.factory;
      const sidebar = ReactWidget.create(
        <JupyterReactTheme colormode={this.colormode}>
          <SidebarFactory
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

type ICellSidebarExtensionOptions = {
  commands?: CommandRegistry;
  factory?: React.JSXElementConstructor<ICellSidebarProps>;
  nbgrader?: boolean;
  sidebarWidth?: number;
  colormode?: Colormode;
};

/**
 * Cell sidebar extension for notebook panels.
 */
export class CellSidebarExtension implements NotebookExtension {
  protected factory: React.JSXElementConstructor<ICellSidebarProps>;
  protected commands?: CommandRegistry;
  protected nbgrader?: boolean;
  protected sidebarWidth?: number;
  protected colormode?: Colormode;
  readonly component: null;

  /**
   * Constructor
   *
   * @param commands Command registry
   * @param factory Cell sidebar React component factory
   * @param nbgrader Whether to activate nbgrader feature or not.
   */
  constructor(options: ICellSidebarExtensionOptions = {}) {
    this.factory = options.factory ?? CellSidebar;
    this.commands = options.commands;
    this.nbgrader = options.nbgrader;
    this.sidebarWidth = options.sidebarWidth;
    this.colormode = options.colormode ?? 'light';
  }

  createNew(panel: NotebookPanel): IDisposable {
    // We assume the extension was either created within JupyterLab passing
    // the app commands registry or through Datalayer workflow that set it
    // when calling `init`.
    const sidebar = new CellSidebarFactory(
      panel,
      this.commands!,
      this.nbgrader,
      this.sidebarWidth,
      this.factory,
      this.colormode
    );
    return sidebar;
  }

  init(props: INotebookExtensionProps): void {
    this.commands = props.commands;
  }
}

export default CellSidebarExtension;
