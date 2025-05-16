/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { ReactPortal } from 'react';
import { INotebookModel } from '@jupyterlab/notebook';
import * as nbformat from '@jupyterlab/nbformat';
import { TableOfContents } from '@jupyterlab/toc';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { NotebookChange } from '@jupyter/ydoc';
import { Kernel as JupyterKernel } from '@jupyterlab/services';
import { Kernel } from '../../jupyter/kernel/Kernel';
import { NotebookCommandIds } from './NotebookCommands';
import { NotebookAdapter } from './NotebookAdapter';

export type PortalDisplay = {
  portal: ReactPortal;
  pinned: boolean;
};

export type INotebookState = {
  model?: INotebookModel;
  tocModel?: TableOfContents.Model;
  adapter?: NotebookAdapter;
  saveRequest?: Date;
  activeCell?: Cell<ICellModel>;
  kernelStatus?: JupyterKernel.Status;
  notebookChange?: NotebookChange;
  portals: ReactPortal[];
  portalDisplay?: PortalDisplay;
};

export interface INotebooksState {
  notebooks: Map<string, INotebookState>;
}

type NotebookUpdate = {
  id: string;
  state: Partial<INotebookState>;
};
type NotebookChangeId = {
  id: string;
  notebookChange: NotebookChange;
};
type NotebookModelId = {
  id: string;
  notebookModel: INotebookModel;
};
type TocModelId = {
  id: string;
  tocModel: TableOfContents.Model;
};
type CellModelId = {
  id: string;
  cellModel?: Cell<ICellModel>;
};
type KernelStatusMutation = {
  id: string;
  kernelStatus: JupyterKernel.Status;
};
type KernelChangeMutation = {
  id: string;
  kernel: Kernel;
};
type ReactPortalsMutation = {
  id: string;
  portals: ReactPortal[];
};
type PortalDisplayMutation = {
  id: string;
  portalDisplay: PortalDisplay | undefined;
};
type DateMutation = {
  id: string;
  date: Date | undefined;
};
type CellMutation = {
  id: string;
  cellType: nbformat.CellType;
  source?: string;
};
  
export type NotebookState = INotebooksState & {
  setNotebooks: (notebooks: Map<string, INotebookState>) => void;
  selectNotebook: (id: string) => INotebookState | undefined;
  selectNotebookAdapter: (id: string) => NotebookAdapter | undefined;
  selectNotebookModel: (id: string) => { model: INotebookModel | undefined; changed: any } | undefined;
  selectTocModel: (id: string) => TableOfContents.Model | undefined;
  selectKernelStatus: (id: string) => string | undefined;
  selectActiveCell: (id: string) => Cell<ICellModel> | undefined;
  selectNotebookPortals: (id: string) => React.ReactPortal[] | undefined;
  selectSaveRequest: (id: string) => Date | undefined;
  selectNotebookPortalDisplay: (id: string) => PortalDisplay | undefined;
  run: (id: string) => void;
  runAll: (id: string) => void;
  interrupt: (id: string) => void;
  insertAbove: (mutation: CellMutation) => void;
  insertBelow: (mutation: CellMutation) => void;
  delete: (id: string) => void;
  changeCellType: (mutation: CellMutation) => void;
  save: (mutation: DateMutation) => void;
  reset: () => void;
  update: (update: NotebookUpdate) => void;
  activeCellChange: (cellModelId: CellModelId) => void;
  changeModel: (notebookModelId: NotebookModelId) => void;
  changeTocModel: (tocModelId: TocModelId) => void;
  changeNotebook: (notebookChangeId: NotebookChangeId) => void;
  changeKernelStatus: (kernelStatusId: KernelStatusMutation) => void;
  changeKernel: (kernelChange: KernelChangeMutation) => void;
  addPortals: (portalsId: ReactPortalsMutation) => void;
  dispose: (id: string) => void;
  setPortals: (portalsId: ReactPortalsMutation) => void;
  setPortalDisplay: (portalDisplayId: PortalDisplayMutation) => void;
};

export const notebookStore = createStore<NotebookState>((set, get) => ({
  notebooks: new Map<string, INotebookState>(),
  setNotebooks: (notebooks: Map<string, INotebookState>) => set((state: NotebookState) => ({ notebooks })),
  selectNotebook: (id: string): INotebookState | undefined => {
    return get().notebooks.get(id);
  },
  selectNotebookAdapter: (id: string): NotebookAdapter | undefined => {
    const notebook = get().notebooks.get(id);
    if (notebook) {
      return notebook.adapter;
    }
    return undefined;
  },
  selectNotebookModel: (id: string): { model: INotebookModel | undefined; changed: any } | undefined => {
    if (get().notebooks.get(id)) {
      return {
        model: get().notebooks.get(id)?.model,
        changed: get().notebooks.get(id)?.model?.contentChanged,
      };    
    }
    return undefined;
  },
  selectTocModel: (id: string): TableOfContents.Model | undefined => {
    return get().notebooks.get(id)?.tocModel;
  },
  selectKernelStatus: (id: string): string | undefined => {
    return get().notebooks.get(id)?.kernelStatus;
  },
  selectActiveCell: (id: string): Cell<ICellModel> | undefined => {
    return get().notebooks.get(id)?.activeCell;
  },
  selectNotebookPortals: (id: string): React.ReactPortal[] | undefined => {
    return get().notebooks.get(id)?.portals;
  },
  selectSaveRequest: (id: string): Date | undefined => {
    return get().notebooks.get(id)?.saveRequest;
  },
  selectNotebookPortalDisplay: (id: string): PortalDisplay | undefined => {
    return get().notebooks.get(id)?.portalDisplay;
  },
  run: (id: string): void => { get().notebooks.get(id)?.adapter?.commands.execute(NotebookCommandIds.run); },
  runAll: (id: string): void => { get().notebooks.get(id)?.adapter?.commands.execute(NotebookCommandIds.runAll); },
  interrupt: (id: string): void => { get().notebooks.get(id)?.adapter?.commands.execute(NotebookCommandIds.interrupt); },
  insertAbove: (mutation: CellMutation) => {
    get().notebooks.get(mutation.id)?.adapter?.setDefaultCellType(mutation.cellType);
    get().notebooks.get(mutation.id)?.adapter?.insertAbove(mutation.source);
  },
  insertBelow: (mutation: CellMutation) => {
    get().notebooks.get(mutation.id)?.adapter?.setDefaultCellType(mutation.cellType);
    get().notebooks.get(mutation.id)?.adapter?.insertBelow(mutation.source);
  },
  delete: (id: string): void => { get().notebooks.get(id)?.adapter?.commands.execute(NotebookCommandIds.deleteCells); },
  changeCellType: (mutation: CellMutation) => {
    get().notebooks.get(mutation.id)?.adapter?.changeCellType(mutation.cellType);
  },
  save: (mutation: DateMutation) => {
    get().notebooks.get(mutation.id)?.adapter?.commands.execute(NotebookCommandIds.save);
    const notebooks = get().notebooks;
    const notebook = notebooks.get(mutation.id);
    if (notebook) {
      notebook.saveRequest = mutation.date;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  reset: () =>  set((state: NotebookState) => ({ notebooks: new Map<string, INotebookState>() })),
  update: (update: NotebookUpdate) => {
    const notebooks = get().notebooks;
    let notebook = notebooks.get(update.id);
    if (notebook) {
      /*
      notebook = {
        ...notebook,
        ...update.state,
      };
      */
      // TODO Revisit this...
      notebook.adapter = update.state.adapter;
    } else {
      notebooks.set(update.id, {
        adapter: update.state.adapter,
        portals: [],
      });    
    }
    set((state: NotebookState) => ({ notebooks }));
  },
  activeCellChange: (cellModelId: CellModelId) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(cellModelId.id);
    if (notebook) {
      notebook.activeCell = cellModelId.cellModel;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  changeModel: (notebookModelId: NotebookModelId) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(notebookModelId.id);
    if (notebook) {
      notebook.model = notebookModelId.notebookModel;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  changeTocModel: (tocModelId: TocModelId) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(tocModelId.id);
    if (notebook) {
      notebook.tocModel = tocModelId.tocModel;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  changeNotebook: (notebookChangeId: NotebookChangeId) => {
    const notebooks = get().notebooks;
    if (notebook) {
      notebook.notebookChange = notebookChangeId.notebookChange;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  changeKernel: (kernelChange: KernelChangeMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(kernelChange.id);
    if (notebook) {
      notebook.adapter?.assignKernel(kernelChange.kernel);
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  changeKernelStatus: (kernelStatusId: KernelStatusMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(kernelStatusId.id);
    if (notebook) {
      notebook.kernelStatus = kernelStatusId.kernelStatus;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  addPortals: (portalsMutation: ReactPortalsMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalsMutation.id);
    if (notebook) {
      notebook.portals = notebook.portals.concat(portalsMutation.portals);
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  dispose: (id: string): void => {
    get().setPortalDisplay({ id, portalDisplay: undefined });
    const notebooks = get().notebooks;
    const notebook = notebooks.get(id);
    if(notebook){
      notebooks.delete(id);
    }
    set((state: NotebookState) => ({ notebooks }));
  },
  setPortals: (portalsMutation: ReactPortalsMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalsMutation.id);
    if (notebook) {
      notebook.portals = portalsMutation.portals;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
  setPortalDisplay: (portalDisplayMutation: PortalDisplayMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalDisplayMutation.id);
    if (notebook) {
      notebook.portalDisplay = portalDisplayMutation.portalDisplay;
      set((state: NotebookState) => ({ notebooks }));
    }
  },
}));

export function useNotebookStore(): NotebookState;
export function useNotebookStore<T>(selector: (state: NotebookState) => T): T;
export function useNotebookStore<T>(selector?: (state: NotebookState) => T) {
  return useStore(notebookStore, selector!);
}

export default useNotebookStore;
