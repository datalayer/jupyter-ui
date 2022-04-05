import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { Store } from 'redux';
import { ICellHeader } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { v4 as uuid_v4 } from 'uuid';
import { notebookActions } from '../NotebookState';
import { LuminoReactPortal } from '../../../lumino/LuminoReactPortal';

const CELL_HEADER_CLASS = 'jp-CellHeader';
const CELL_HEADER_DIV_CLASS = 'dla-CellHeader-container';

export class CellSidebar extends LuminoReactPortal implements ICellHeader {
  private readonly commands: CommandRegistry;
  constructor(sidebarReact: any, commands: CommandRegistry, store: Store) {
    super();
    this.commands = commands;
    this.addClass(CELL_HEADER_CLASS);
    this.id = uuid_v4();
    const sidebar = createElement(
      sidebarReact,
      {
        command: this.commands,
        id: this.id
      }
    );
    const portal = createPortal(
      <div className={CELL_HEADER_DIV_CLASS}>
        {sidebar}
      </div>
      ,
      this.node
    );
    store.dispatch(notebookActions.portal(portal));
  }
}
