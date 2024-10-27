/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// import { createPortal } from 'react-dom';
import { Widget, PanelLayout } from '@lumino/widgets';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IObservableList } from '@jupyterlab/observables';
import { Cell, CodeCell, ICellModel } from '@jupyterlab/cells';
import { IDatalayerNotebookExtensionProps } from '../../../components';
import { CellToolbar } from './CellToolbar';

export interface ICellToolbarSettings {
  highlight: boolean;
  positioning: string;
}

export class CellToolbarWidget extends Widget {
  private _panel: NotebookPanel;
  private _props: IDatalayerNotebookExtensionProps;

  constructor(panel: NotebookPanel, props: IDatalayerNotebookExtensionProps) {
    super();
    this._panel = panel;
    this._props = props;
    this.updateConnectedCell = this.updateConnectedCell.bind(this);
    const cells = this._panel.context.model.cells;
    cells.changed.connect(this.updateConnectedCell);
    for (let i = 0; i < cells.length; ++i) {
      this._registerCellChanges(cells.get(i));
    }
  }

  private updateConnectedCell(cells: any, changed: IObservableList.IChangedArgs<ICellModel>) {
    changed.oldValues.forEach(this._deregisterCellChanges.bind(this));
    changed.newValues.forEach(this._registerCellChanges.bind(this));
  }

  private _deregisterCellChanges(cellModel: ICellModel) {
  }

  private _registerCellChanges(cellModel: ICellModel, disableHighlight = false) {
    const codeCell = this._getCodeCell(cellModel);
    if (codeCell) {
      codeCell.displayChanged.connect(() => {
        this._updateCodeCell(codeCell, disableHighlight);
      });
      codeCell.inViewportChanged.connect(() => {
        this._updateCodeCell(codeCell, disableHighlight);
      });
      this._updateCodeCell(codeCell, disableHighlight);
    } else {
      if (cellModel.type === 'code') {
        console.error(`Could not find code cell for model: ${cellModel}`);
      }
    }
  }

  private _getCodeCell(cellModel: ICellModel): CodeCell | null {
    if (cellModel.type === 'code') {
      const cell = this._panel.content.widgets.find(
        (widget: Cell) => widget.model === cellModel
      );
      return cell as CodeCell;
    }
    return null;
  }

  private _updateCodeCell(cell: CodeCell, disableHighlight: boolean) {
    if (cell.inputArea) {
      const layout = cell.layout;
      if (layout) {
        const panelLayout = layout as PanelLayout;
        panelLayout.insertWidget(1, new CellToolbar(cell, this._props));
      }
    }
  }

}
