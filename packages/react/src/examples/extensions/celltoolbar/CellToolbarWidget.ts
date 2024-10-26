/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Widget } from '@lumino/widgets';
import { JSONExt, JSONObject } from '@lumino/coreutils';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IObservableList } from '@jupyterlab/observables';
import { Cell, CodeCell, ICellModel } from '@jupyterlab/cells';
import { IMapChange } from '@jupyter/ydoc';
import { getTimeDiff, getTimeString } from './../exectime/utils';

const EXECUTE_TIME_CLASS = 'dla-CellToolbar';

const ANIMATE_TIME_MS = 1000;

const ANIMATE_CSS = `executeHighlight ${ANIMATE_TIME_MS}ms`;

export interface ICellToolbarSettings {
  highlight: boolean;
  positioning: string;
}

export class CellToolbarWidget extends Widget {
  private _panel: NotebookPanel;

  private _cellSlotMap: {
    [id: string]: (
      sender: ICellModel,
      args: IMapChange
    ) => void;
  } = {};

  private _settings: ICellToolbarSettings = {
    highlight: true,
    positioning: 'left'
  };

  constructor(panel: NotebookPanel) {
    super();
    this._panel = panel;
    this.updateConnectedCell = this.updateConnectedCell.bind(this);
    const cells = this._panel.context.model.cells;
    cells.changed.connect(this.updateConnectedCell);
    for (let i = 0; i < cells.length; ++i) {
      this._registerMetadataChanges(cells.get(i));
    }
  }

  private updateConnectedCell(cells: any, changed: IObservableList.IChangedArgs<ICellModel>) {
    changed.oldValues.forEach(this._deregisterMetadataChanges.bind(this));
    changed.newValues.forEach(this._registerMetadataChanges.bind(this));
  }

  private _registerMetadataChanges(cellModel: ICellModel) {
    if (!(cellModel.id in this._cellSlotMap)) {
      const fn = () => this._cellMetadataChanged(cellModel);
      this._cellSlotMap[cellModel.id] = fn;
      cellModel.metadataChanged.connect(fn);
    }
    this._cellMetadataChanged(cellModel, true);
  }

  private _deregisterMetadataChanges(cellModel: ICellModel) {
    const fn = this._cellSlotMap[cellModel.id];
    if (fn) {
      cellModel.metadataChanged.disconnect(fn);
      const codeCell = this._getCodeCell(cellModel);
      if (codeCell) {
        this._removeExecuteNode(codeCell);
      }
    }
    delete this._cellSlotMap[cellModel.id];
  }

  private _cellMetadataChanged(cellModel: ICellModel, disableHighlight = false) {
    const codeCell = this._getCodeCell(cellModel);
    if (codeCell) {
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

  private _removeExecuteNode(cell: CodeCell) {
    if (cell.inputArea) {
      const editorWidget = cell.inputArea.editorWidget;
      const executionTimeNode = editorWidget.node.querySelector(
        `.${EXECUTE_TIME_CLASS}`
      );
      if (executionTimeNode) {
        executionTimeNode.remove();
      }
    }
  }

  private _updateCodeCell(cell: CodeCell, disableHighlight: boolean) {
    const executionMetadata = cell.model.getMetadata('execution') as JSONObject;
    if (executionMetadata && JSONExt.isObject(executionMetadata)) {
      const editorWidget = cell.inputArea!.editorWidget;
      let executionTimeNode: HTMLDivElement | null = editorWidget.node.querySelector(
        `.${EXECUTE_TIME_CLASS}`
      );
      if (!executionTimeNode) {
        executionTimeNode = document.createElement('div') as HTMLDivElement;
        editorWidget.node.append(executionTimeNode);
      }
      let positioning;
      switch (this._settings.positioning) {
        case 'left':
          positioning = 'left';
          break;
        case 'right':
          positioning = 'right';
          break;
        default:
          console.error(
            `'${positioning}' is not a valid type for the setting 'positioning'`
          );
      }
      const positioningClass = `${EXECUTE_TIME_CLASS}-positioning-${this._settings.positioning}`;
      executionTimeNode.className = `${EXECUTE_TIME_CLASS} ${positioningClass}`;
      const queuedTimeStr = executionMetadata['iopub.status.busy'] as
        | string
        | null;
      const queuedTime = queuedTimeStr ? new Date(queuedTimeStr) : null;
      const startTimeStr = (executionMetadata['shell.execute_reply.started'] ||
        executionMetadata['iopub.execute_input']) as string | null;
      const startTime = startTimeStr ? new Date(startTimeStr) : null;
      const endTimeStr = executionMetadata['shell.execute_reply'] as
        | string
        | null;
      const endTime = endTimeStr ? new Date(endTimeStr) : null;
      let msg = '';
      if (endTime) {
        msg = `Last executed at ${getTimeString(endTime)} in ${getTimeDiff(
          endTime,
          startTime!
        )}`;
      } else if (startTime) {
        msg = `Execution started at ${getTimeString(startTime)}`;
      } else if (queuedTime) {
        msg = `Execution queued at ${getTimeString(queuedTime)}`;
      }
      if (executionTimeNode.innerText !== msg) {
        executionTimeNode.innerText = msg;
        if (!disableHighlight && this._settings.highlight && endTimeStr) {
          executionTimeNode.style.setProperty('animation', ANIMATE_CSS);
          setTimeout(
            () => executionTimeNode!.style.removeProperty('animation'),
            ANIMATE_TIME_MS
          );
        }
      }
    } else {
      this._removeExecuteNode(cell);
    }
  }

}
