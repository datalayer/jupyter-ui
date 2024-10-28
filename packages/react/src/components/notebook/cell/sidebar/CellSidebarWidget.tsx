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

export const DATALAYER_CELL_SIDEBAR_CLASS_NAME = 'dla-CellSidebar-Container';

export type ICellSidebarProps = {
  notebookId: string;
  cellNodeId: string;
  command: CommandRegistry;
  nbgrader: boolean;
}

export class CellSidebarWidget extends ReactPortalWidget implements ICellHeader {
  private readonly _commands: CommandRegistry;
  constructor(
    CellSidebar: (props: ICellSidebarProps) => JSX.Element,
    notebookId: string,
    nbgrader: boolean,
    commands: CommandRegistry,
  ) {
    super();
    this._commands = commands;
    this.addClass('jp-CellHeader');
    const cellNodeId = newUuid();
    this.node.id = cellNodeId;
    const props: ICellSidebarProps = {
      notebookId: notebookId,
      cellNodeId,
      command: this._commands,
      nbgrader,
    };
    const sidebar = createElement(CellSidebar, props);
    const portalDiv = (
      <div className={DATALAYER_CELL_SIDEBAR_CLASS_NAME}>
        {sidebar}
      </div>
    );
    const portal = createPortal(portalDiv, this.node);
    notebookStore.getState().addPortals({
      id: notebookId,
      portals: [portal],
    });
  }
}

export default CellSidebarWidget;
