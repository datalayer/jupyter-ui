import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { Store } from 'redux';
import { ICellHeader } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { newUuid } from '../../../../utils/Utils';
import { ReactPortalWidget } from '../../../../jupyter/lumino/ReactPortalWidget';
import { notebookActions } from '../../NotebookState';

export const DATALAYER_CELL_HEADER_CLASS = 'dla-CellHeader-Container';

export type CellSidebarProps = {
  notebookId: string;
  cellId: string;
  command: CommandRegistry;
  nbgrader: boolean;
}

export class CellSidebarWidget extends ReactPortalWidget implements ICellHeader {
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
      notebookId: notebookId,
      cellId: this.id,
      command: this.commands,
      nbgrader,
    };
    const sidebar = createElement(CellSidebar, props);
    const portalDiv = (
      <div className={DATALAYER_CELL_HEADER_CLASS}>
        {sidebar}
      </div>
    )
    const portal = createPortal(portalDiv, this.node);
    store.dispatch(notebookActions.addPortals({
      uid: notebookId,
      portals: [portal]
    }));
  }
}

export default CellSidebarWidget;
