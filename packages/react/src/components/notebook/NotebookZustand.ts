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
import { Cell, ICellModel } from '@jupyterlab/cells';
import { NotebookChange } from '@jupyter/ydoc';
import { Kernel as JupyterKernel } from '@jupyterlab/services';
import { INotebooksState, INotebookState, PortalDisplay } from './NotebookState';
import { cmdIds } from './NotebookCommands';
import Kernel from '../../jupyter/kernel/Kernel';

type UpdateUid = {
  uid: string;
  partialState: Partial<INotebookState>;
};
type NotebookChangeUid = {
  uid: string;
  notebookChange: NotebookChange;
};
type NotebookModelUid = {
  uid: string;
  notebookModel: INotebookModel;
};
type CellModelUid = {
  uid: string;
  cellModel?: Cell<ICellModel>;
};
type KernelStatusMutation = {
  uid: string;
  kernelStatus: JupyterKernel.Status;
};
type KernelChangeMutation = {
  uid: string;
  kernel: Kernel;
};
type ReactPortalsMutation = {
  uid: string;
  portals: ReactPortal[];
};
type PortalDisplayMutation = {
  uid: string;
  portalDisplay: PortalDisplay | undefined;
};
type DateMutation = {
  uid: string;
  date: Date | undefined;
};
type CellMutation = {
  uid: string;
  cellType: nbformat.CellType;
  source?: string;
};
  
export type NotebookZustandState = INotebooksState & {
  setNotebooks: (notebooks: Map<string, INotebookState>) => void;
  selectNotebookModel: (uid: string) => { model: INotebookModel | undefined; changed: any } | undefined;
  selectKernelStatus: (uid: string) => string | undefined;
  selectActiveCell: (uid: string) => Cell<ICellModel> | undefined;
  selectNotebookPortals: (uid: string) => React.ReactPortal[] | undefined;
  selectSaveRequest: (uid: string) => Date | undefined;
  selectNotebookPortalDisplay: (uid: string) => PortalDisplay | undefined;
  run: (uid: string) => void;
  runAll: (uid: string) => void;
  interrupt: (uid: string) => void;
  insertAbove: (mutation: CellMutation) => void;
  insertBelow: (mutation: CellMutation) => void;
  delete: (uid: string) => void;
  changeCellType: (mutation: CellMutation) => void;
  save: (mutation: DateMutation) => void;
  reset: () => void;
  update: (update: UpdateUid) => void;
  activeCellChange: (cellModelUid: CellModelUid) => void;
  modelChange: (notebookModelUid: NotebookModelUid) => void;
  notebookChange: (notebookChangeUid: NotebookChangeUid) => void;
  kernelStatusChanged: (kernelStatusUid: KernelStatusMutation) => void;
  changeKernel: (kernelChange: KernelChangeMutation) => void;
  addPortals: (portalsUid: ReactPortalsMutation) => void;
  dispose: (uid: string) => void;
  setPortals: (portalsUid: ReactPortalsMutation) => void;
  setPortalDisplay: (portalDisplayUid: PortalDisplayMutation) => void;
};

export const notebookStore = createStore<NotebookZustandState>((set, get) => ({
  notebooks: new Map<string, INotebookState>(),
  setNotebooks: (notebooks: Map<string, INotebookState>) => set((state: NotebookZustandState) => ({ notebooks })),
  selectNotebook: (uid: string): INotebookState | undefined => {
    return get().notebooks.get(uid);
  },
  selectNotebookModel: (uid: string): { model: INotebookModel | undefined; changed: any } | undefined => {
    if (get().notebooks.get(uid)) {
      return {
        model: get().notebooks.get(uid)?.model,
        changed: get().notebooks.get(uid)?.model?.contentChanged,
      };    
    }
    return undefined;
  },
  selectKernelStatus: (uid: string): string | undefined => {
    return get().notebooks.get(uid)?.kernelStatus;
  },
  selectActiveCell: (uid: string): Cell<ICellModel> | undefined => {
    return get().notebooks.get(uid)?.activeCell;
  },
  selectNotebookPortals: (uid: string): React.ReactPortal[] | undefined => {
    return get().notebooks.get(uid)?.portals;
  },
  selectSaveRequest: (uid: string): Date | undefined => {
    return get().notebooks.get(uid)?.saveRequest;
  },
  selectNotebookPortalDisplay: (uid: string): PortalDisplay | undefined => {
    return get().notebooks.get(uid)?.portalDisplay;
  },
  run: (uid: string): void => { get().notebooks.get(uid)?.adapter?.commands.execute(cmdIds.run); },
  runAll: (uid: string): void => { get().notebooks.get(uid)?.adapter?.commands.execute(cmdIds.runAll); },
  interrupt: (uid: string): void => { get().notebooks.get(uid)?.adapter?.commands.execute(cmdIds.interrupt); },
  insertAbove: (mutation: CellMutation) => {
    get().notebooks.get(mutation.uid)?.adapter?.setDefaultCellType(mutation.cellType);
    get().notebooks.get(mutation.uid)?.adapter?.insertAbove(mutation.source);
  },
  insertBelow: (mutation: CellMutation) => {
    get().notebooks.get(mutation.uid)?.adapter?.setDefaultCellType(mutation.cellType);
    get().notebooks.get(mutation.uid)?.adapter?.insertBelow(mutation.source);
  },
  delete: (uid: string): void => { get().notebooks.get(uid)?.adapter?.commands.execute(cmdIds.deleteCells); },
  changeCellType: (mutation: CellMutation) => {
    get().notebooks.get(mutation.uid)?.adapter?.changeCellType(mutation.cellType);
  },
  save: (mutation: DateMutation) => {
    get().notebooks.get(mutation.uid)?.adapter?.commands.execute(cmdIds.save);
    const notebooks = get().notebooks;
    const notebook = notebooks.get(mutation.uid);
    if (notebook) {
      notebook.saveRequest = mutation.date;
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  reset: () =>  set((state: NotebookZustandState) => ({ notebooks: new Map<string, INotebookState>() })),
  update: (update: UpdateUid) => {
    const notebooks = get().notebooks;
    let notebook = notebooks.get(update.uid);
    if (notebook) {
      notebook = { ...notebook, ...update.partialState };
      set((state: NotebookZustandState) => ({ notebooks }));
    } else {
      notebooks.set(update.uid, {
        adapter: update.partialState.adapter,
        portals: [],
      });    
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  activeCellChange: (cellModelUid: CellModelUid) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(cellModelUid.uid);
    if (notebook) {
      notebook.activeCell = cellModelUid.cellModel;
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  modelChange: (notebookModelUid: NotebookModelUid) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(notebookModelUid.uid);
    if (notebook) {
      notebook.model = notebookModelUid.notebookModel;
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  notebookChange: (notebookChangeUid: NotebookChangeUid) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(notebookChangeUid.uid);
    if (notebook) {
      notebook.notebookChange = notebookChangeUid.notebookChange;
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  kernelStatusChanged: (kernelStatusUid: KernelStatusMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(kernelStatusUid.uid);
    if (notebook) {
      notebook.kernelStatus = kernelStatusUid.kernelStatus;
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  changeKernel: (kernelChange: KernelChangeMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(kernelChange.uid);
    if (notebook) {
      notebook.adapter?.assignKernel(kernelChange.kernel);
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  addPortals: (portalsUid: ReactPortalsMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalsUid.uid);
    if (notebook) {
      notebook.portals = notebook.portals.concat(portalsUid.portals);
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  dispose: (uid: string): void => {
    const notebooks = get().notebooks;
    notebooks.delete(uid);
    set((state: NotebookZustandState) => ({ notebooks }));
  },
  setPortals: (portalsUid: ReactPortalsMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalsUid.uid);
    if (notebook) {
      notebook.portals = portalsUid.portals;
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
  setPortalDisplay: (portalDisplayUid: PortalDisplayMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalDisplayUid.uid);
    if (notebook) {
      notebook.portalDisplay = portalDisplayUid.portalDisplay;
      set((state: NotebookZustandState) => ({ notebooks }));
    }
  },
}));

export function useNotebookStore(): NotebookZustandState;
export function useNotebookStore<T>(selector: (state: NotebookZustandState) => T): T;
export function useNotebookStore<T>(selector?: (state: NotebookZustandState) => T) {
  return useStore(notebookStore, selector!);
}

export default useNotebookStore;
