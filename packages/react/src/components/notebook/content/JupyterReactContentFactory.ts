/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Cell, CodeCell } from '@jupyterlab/cells';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
// import { CodeMirrorEditor } from '@jupyterlab/codemirror';
// import { IInputPrompt } from '@jupyterlab/cells';
// import { NotebookInputPrompt } from './../cell/InputPrompt';

export const PYTHON_CELL_MIMETYPE = 'text/x-ipython';

export const SQL_CELL_MIMETYPE = 'application/sql';

export const isSQLCell = (cell: Cell) => {
  // Note: sometimes model is null
  const datalayer = cell.model?.getMetadata('datalayer');
  if (datalayer) {
    return datalayer['sql'] === true;
  }
  return false;
};

class DatalayerCodeCell extends CodeCell {
  constructor(options: CodeCell.IOptions) {
    super(options);
  }
}

/**
 * Extend the default implementation NotebookPanel.ContentFactory of `IContentFactory`.
 */
export class JupyterReactContentFactory extends NotebookPanel.ContentFactory {
  private _updateSQLEditor = (cell: CodeCell) => {
    if (isSQLCell(cell)) {
      (cell.editor!.model as CodeEditor.Model).mimeType = SQL_CELL_MIMETYPE;
    }
  };

  private _updateEditor = (cell: CodeCell) => {
    if (cell.editor) {
      cell.editor.model.mimeTypeChanged.connect((_, args) => {
        this._updateSQLEditor(cell);
      });
      this._updateSQLEditor(cell);
    }
  };

  /** @override */
  createNotebook(options: Notebook.IOptions): Notebook {
    const notebook = super.createNotebook(options);
    return notebook;
  }

  /** @override */
  createCodeCell(options: CodeCell.IOptions): CodeCell {
    const cell = new DatalayerCodeCell(options);
    if (cell.inViewport) {
      this._updateEditor(cell);
    }
    cell.displayChanged.connect(() => {
      this._updateEditor(cell);
    });
    cell.inViewportChanged.connect(() => {
      this._updateEditor(cell);
    });
    return cell;
  }

  /** @override */
  /*
  createInputPrompt(): IInputPrompt {
//    return new InputPrompt();
    return super.createInputPrompt();
  }
  */
}

export default JupyterReactContentFactory;
