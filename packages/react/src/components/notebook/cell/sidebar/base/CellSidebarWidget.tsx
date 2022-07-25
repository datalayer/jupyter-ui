import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { Store } from 'redux';
import { ICellHeader } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { newUuid } from '../../../../../jupyter/utils/Ids';
import { LuminoReactPortal } from '../../../../../jupyter/lumino/LuminoReactPortal';
import { notebookActions } from '../../../NotebookState';

export const DLA_CELL_HEADER_CLASS = 'dla-CellHeader-Container';

export type CellSidebarProps = {
  command: CommandRegistry;
  id: string;
  nbgrader: boolean;
}

export class CellSidebarWidget extends LuminoReactPortal implements ICellHeader {
  private readonly commands: CommandRegistry;
  constructor(
    CellSidebar: (props: CellSidebarProps) => JSX.Element,
    nbgrader: boolean,
    commands: CommandRegistry,
    store: Store,
    ) {
    super();
    this.commands = commands;
    this.addClass('jp-CellHeader');
    this.id = newUuid();
    const props: CellSidebarProps = {
      command: this.commands,
      id: this.id,
      nbgrader,
    };
    const sidebar = createElement(
      CellSidebar,
      props,
    );
    const portal = createPortal(
      <div className={DLA_CELL_HEADER_CLASS}>
        {sidebar}
      </div>
      ,
      this.node,
    );
    store.dispatch(notebookActions.portal([portal]));
  }
}

export default CellSidebarWidget;
