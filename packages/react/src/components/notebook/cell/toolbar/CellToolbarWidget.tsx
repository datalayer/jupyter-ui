/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { ICellHeader } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { newUuid } from '../../../../utils/Utils';
import { ReactPortalWidget } from '../../../lumino/ReactPortalWidget';
import { notebookStore } from '../../NotebookState';

export const DATALAYER_CELL_TOOLBAR_CLASS_NAME = 'dla-CellToolbar-Container';

export type ICellToolbarProps = {
  notebookId: string;
  cellId: string;
  command: CommandRegistry;
  nbgrader: boolean;
};

export class CellToolbarWidget
  extends ReactPortalWidget
  implements ICellHeader
{
  private readonly commands: CommandRegistry;
  constructor(
    CellToolbar: (props: ICellToolbarProps) => JSX.Element,
    notebookId: string,
    nbgrader: boolean,
    commands: CommandRegistry,
  ) {
    super();
    this.commands = commands;
    this.addClass('jp-CellHeader');
    this.id = newUuid();
    const props: ICellToolbarProps = {
      notebookId: notebookId,
      cellId: this.id,
      command: this.commands,
      nbgrader,
    };
    const toolbar = createElement(CellToolbar, props);
    const portalDiv = (
      <div className={DATALAYER_CELL_TOOLBAR_CLASS_NAME}>{toolbar}</div>
    );
    const portal = createPortal(portalDiv, this.node);
    notebookStore.getState().addPortals({
      id: notebookId,
      portals: [portal],
    });
  }
}

export default CellToolbarWidget;
