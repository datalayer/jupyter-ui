import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { Store } from 'redux';
import { ICellHeader } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { newUuid } from '../../../../../jupyter/utils/Ids';
import { LuminoReactPortal } from '../../../../../jupyter/lumino/LuminoReactPortal';
import { notebookActions } from '../../../NotebookState';

export const DATALAYER_CELL_HEADER_CLASS = 'dla-CellHeader-Container';

export type CellSidebarProps = {
  notebookId: string;
  cellId: string;
  command: CommandRegistry;
  nbgrader: boolean;
}

export class CellSidebarWidget extends LuminoReactPortal implements ICellHeader {
  private readonly commands: CommandRegistry;
  constructor(
    CellSidebar: (props: CellSidebarProps) => JSX.Element,
    notebookId: string,
    nbgrader: boolean,
    commands: CommandRegistry,
    store: Store,
    ) {
    super();
    this.commands = commands;
    this.addClass('jp-CellHeader');
    this.id = newUuid();
    const props: CellSidebarProps = {
      notebookId,
      cellId: this.id,
      command: this.commands,
      nbgrader,
    };
    const sidebar = createElement(
      CellSidebar,
      props,
    );
    const portal = createPortal(
      <div className={DATALAYER_CELL_HEADER_CLASS}>
        {sidebar}
      </div>
      ,
      this.node,
    );
    store.dispatch(notebookActions.addPortals({ uid: notebookId, portals: [portal] }));
  }
}

export default CellSidebarWidget;
