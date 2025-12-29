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

export type NotebookUpdate = {
  id: string;
  state: Partial<INotebookState>;
};
export type NotebookChangeId = {
  id: string;
  notebookChange: NotebookChange;
};
export type NotebookModelId = {
  id: string;
  notebookModel: INotebookModel;
};
export type TocModelId = {
  id: string;
  tocModel: TableOfContents.Model;
};
export type CellModelId = {
  id: string;
  cellModel?: Cell<ICellModel>;
};
export type KernelStatusMutation = {
  id: string;
  kernelStatus: JupyterKernel.Status;
};
export type KernelChangeMutation = {
  id: string;
  kernel: Kernel;
};
export type ReactPortalsMutation = {
  id: string;
  portals: ReactPortal[];
};
export type PortalDisplayMutation = {
  id: string;
  portalDisplay: PortalDisplay | undefined;
};
export type DateMutation = {
  id: string;
  date: Date | undefined;
};
export type CellMutation = {
  id: string;
  cellType: nbformat.CellType;
  source?: string;
};

export type NotebookState = INotebooksState & {
  // Core store methods
  setNotebooks: (notebooks: Map<string, INotebookState>) => void;
  selectNotebook: (id: string) => INotebookState | undefined;
  selectNotebookAdapter2: (id: string) => NotebookAdapter | undefined;

  // Tool operation methods (1:1 with tool operations) - individual parameters
  // Note: params after id are optional because executor passes them as object: { id, ...params }
  insertCell: (
    id: string,
    type?: nbformat.CellType,
    index?: number,
    source?: string
  ) => void;
  insertCells: (
    id: string,
    cells?: Array<{ type: string; source: string }>,
    index?: number
  ) => void;
  deleteCell: (id: string, index?: number) => void;
  updateCell: (id: string, index?: number, source?: string) => void;
  readCell: (
    id: string,
    index?: number,
    includeOutputs?: boolean
  ) =>
    | {
        type: nbformat.CellType;
        source: string;
        execution_count?: number | null;
        outputs?: unknown[];
      }
    | undefined;
  readAllCells: (
    id: string,
    format?: 'brief' | 'detailed'
  ) => Array<{
    index: number;
    type: string;
    preview?: string;
    source?: string;
    execution_count?: number | null;
    outputs?: unknown[];
  }>;
  executeCode: (
    id: string,
    code?: string
  ) => Promise<{
    success: boolean;
    outputs?: unknown[];
    error?: string;
  }>;
  runCell: (
    id: string
  ) => Promise<
    { execution_count?: number | null; outputs?: Array<string> } | undefined
  >;
  runAllCells: (id: string) => void;
  clearAllOutputs: (id: string) => void;

  // Original methods (from legacy API)
  run: (id: string) => void;
  runAll: (id: string) => void;
  interrupt: (id: string) => void;
  insertAbove: (id: string, type: nbformat.CellType, source?: string) => void;
  insertBelow: (id: string, type: nbformat.CellType, source?: string) => void;
  delete: (id: string) => void;
  changeCellType: (id: string, type: nbformat.CellType) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  reset: () => void;

  // Methods from NotebookState0 (legacy compatibility)
  selectNotebookAdapter: (id: string) => NotebookAdapter | undefined;
  selectNotebookModel: (
    id: string
  ) => { model: INotebookModel | undefined; changed: unknown } | undefined;
  selectTocModel: (id: string) => TableOfContents.Model | undefined;
  selectKernelStatus: (id: string) => string | undefined;
  selectActiveCell: (id: string) => Cell<ICellModel> | undefined;
  selectNotebookPortals: (id: string) => ReactPortal[] | undefined;
  selectSaveRequest: (id: string) => Date | undefined;
  selectNotebookPortalDisplay: (id: string) => PortalDisplay | undefined;
  save: (mutation: DateMutation) => void;
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
  setNotebooks: (notebooks: Map<string, INotebookState>) =>
    set((_state: NotebookState) => ({ notebooks })),
  selectNotebook: (id: string): INotebookState | undefined => {
    return get().notebooks.get(id);
  },
  selectNotebookAdapter2: (id: string): NotebookAdapter | undefined => {
    const notebook = get().notebooks.get(id);
    if (notebook) {
      return notebook.adapter;
    }
    return undefined;
  },
  // Tool operation methods - use individual parameters in signature, destructure in implementation
  insertCell: (
    id: string,
    type?: nbformat.CellType,
    index?: number,
    source?: string
  ): void => {
    // Accept object from executor, destructure it
    const params = typeof id === 'object' ? id : { id, type, index, source };
    get()
      .notebooks.get(params.id as string)
      ?.adapter?.insertCell(
        params.type as nbformat.CellType,
        params.index,
        params.source as string | undefined
      );
  },
  insertCells: (id: string, cells?: unknown[], index?: number): void => {
    const params = typeof id === 'object' ? id : { id, cells, index };
    get()
      .notebooks.get(params.id as string)
      ?.adapter?.insertCells(
        params.cells as Array<{ type: nbformat.CellType; source: string }>,
        params.index as number
      );
  },
  deleteCell: (id: string, index?: number): void => {
    const params = typeof id === 'object' ? id : { id, index };
    get().notebooks.get(params.id)?.adapter?.deleteCell(params.index);
  },
  updateCell: (id: string, index?: number, source?: string): void => {
    const params = typeof id === 'object' ? id : { id, index, source };
    get()
      .notebooks.get(params.id as string)
      ?.adapter?.updateCell(params.index as number, params.source as string);
  },
  readCell: (
    id: string,
    index?: number,
    includeOutputs?: boolean
  ):
    | {
        type: nbformat.CellType;
        source: string;
        execution_count?: number | null;
        outputs?: unknown[];
      }
    | undefined => {
    const params = typeof id === 'object' ? id : { id, index, includeOutputs };
    return get()
      .notebooks.get(params.id as string)
      ?.adapter?.getCell(params.index as number, params.includeOutputs ?? true);
  },
  readAllCells: (
    id: string,
    format?: 'brief' | 'detailed'
  ): Array<{
    index: number;
    type: string;
    preview?: string;
    source?: string;
    execution_count?: number | null;
    outputs?: unknown[];
  }> => {
    const params = typeof id === 'object' ? id : { id, format };
    return (
      get()
        .notebooks.get(params.id as string)
        ?.adapter?.readAllCells(params.format as 'brief' | 'detailed') ?? []
    );
  },
  executeCode: async (
    id: string,
    code?: string
  ): Promise<{
    success: boolean;
    outputs?: unknown[];
    error?: string;
  }> => {
    const params = typeof id === 'object' ? id : { id, code };
    return (
      (await get()
        .notebooks.get(params.id as string)
        ?.adapter?.executeCode(params.code as string)) ?? {
        success: false,
        error: 'Adapter not found',
      }
    );
  },
  runCell: async (
    id: string | { id: string }
  ): Promise<
    { execution_count?: number | null; outputs?: Array<string> } | undefined
  > => {
    const params = typeof id === 'object' ? id : { id };
    const adapter = get().notebooks.get(params.id)?.adapter;
    if (!adapter) {
      return undefined;
    }
    // runCell on adapter expects { index?, timeoutSeconds?, etc. } not { id }
    return await adapter.runCell();
  },
  runAllCells: (id: string | { id: string }): void => {
    const params = typeof id === 'object' ? id : { id };
    get().notebooks.get(params.id)?.adapter?.runAllCells();
  },
  clearAllOutputs: (id: string): void => {
    get().notebooks.get(id)?.adapter?.clearAllOutputs();
  },

  // Original methods (from legacy API)
  run: (id: string): void => {
    get().notebooks.get(id)?.adapter?.runCell();
  },
  runAll: (id: string): void => {
    get().notebooks.get(id)?.adapter?.runAllCells();
  },
  interrupt: (id: string): void => {
    get()
      .notebooks.get(id)
      ?.adapter?.commands.execute(NotebookCommandIds.interrupt);
  },
  insertAbove: (id: string, type: nbformat.CellType, source?: string) => {
    get().notebooks.get(id)?.adapter?.setDefaultCellType(type);
    get().notebooks.get(id)?.adapter?.insertAbove(source);
  },
  insertBelow: (id: string, type: nbformat.CellType, source?: string) => {
    get().notebooks.get(id)?.adapter?.setDefaultCellType(type);
    get().notebooks.get(id)?.adapter?.insertBelow(source);
  },
  delete: (id: string): void => {
    get().notebooks.get(id)?.adapter?.deleteCell();
  },
  changeCellType: (id: string, type: nbformat.CellType) => {
    get().notebooks.get(id)?.adapter?.changeCellType(type);
  },
  undo: (id: string): void => {
    get().notebooks.get(id)?.adapter?.undo();
  },
  redo: (id: string): void => {
    get().notebooks.get(id)?.adapter?.redo();
  },
  reset: () =>
    set((_state: NotebookState) => ({
      notebooks: new Map<string, INotebookState>(),
    })),

  // Methods from NotebookState0 (legacy compatibility)
  selectNotebookAdapter: (id: string): NotebookAdapter | undefined => {
    const notebook = get().notebooks.get(id);
    if (notebook) {
      return notebook.adapter;
    }
    return undefined;
  },
  selectNotebookModel: (
    id: string
  ): { model: INotebookModel | undefined; changed: unknown } | undefined => {
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
  selectNotebookPortals: (id: string): ReactPortal[] | undefined => {
    return get().notebooks.get(id)?.portals;
  },
  selectSaveRequest: (id: string): Date | undefined => {
    return get().notebooks.get(id)?.saveRequest;
  },
  selectNotebookPortalDisplay: (id: string): PortalDisplay | undefined => {
    return get().notebooks.get(id)?.portalDisplay;
  },
  save: (mutation: DateMutation) => {
    get()
      .notebooks.get(mutation.id)
      ?.adapter?.commands.execute(NotebookCommandIds.save);
    const notebooks = get().notebooks;
    const notebook = notebooks.get(mutation.id);
    if (notebook) {
      notebook.saveRequest = mutation.date;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  update: (update: NotebookUpdate) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(update.id);
    if (notebook) {
      notebook.adapter = update.state.adapter;
    } else {
      notebooks.set(update.id, {
        adapter: update.state.adapter,
        portals: [],
      });
    }
    set((_state: NotebookState) => ({ notebooks }));
  },
  activeCellChange: (cellModelId: CellModelId) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(cellModelId.id);
    if (notebook) {
      notebook.activeCell = cellModelId.cellModel;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  changeModel: (notebookModelId: NotebookModelId) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(notebookModelId.id);
    if (notebook) {
      notebook.model = notebookModelId.notebookModel;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  changeTocModel: (tocModelId: TocModelId) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(tocModelId.id);
    if (notebook) {
      notebook.tocModel = tocModelId.tocModel;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  changeNotebook: (notebookChangeId: NotebookChangeId) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(notebookChangeId.id);
    if (notebook) {
      notebook.notebookChange = notebookChangeId.notebookChange;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  changeKernel: (kernelChange: KernelChangeMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(kernelChange.id);
    if (notebook) {
      // TODO: assignKernel method needs to be implemented in NotebookAdapter
      // notebook.adapter?.assignKernel(kernelChange.kernel);
      void kernelChange.kernel; // Silence unused variable warning
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  changeKernelStatus: (kernelStatusId: KernelStatusMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(kernelStatusId.id);
    if (notebook) {
      notebook.kernelStatus = kernelStatusId.kernelStatus;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  addPortals: (portalsMutation: ReactPortalsMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalsMutation.id);
    if (notebook) {
      notebook.portals = notebook.portals.concat(portalsMutation.portals);
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  dispose: (id: string): void => {
    get().setPortalDisplay({ id, portalDisplay: undefined });
    const notebooks = get().notebooks;
    const notebook = notebooks.get(id);
    if (notebook) {
      notebooks.delete(id);
    }
    set((_state: NotebookState) => ({ notebooks }));
  },
  setPortals: (portalsMutation: ReactPortalsMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalsMutation.id);
    if (notebook) {
      notebook.portals = portalsMutation.portals;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
  setPortalDisplay: (portalDisplayMutation: PortalDisplayMutation) => {
    const notebooks = get().notebooks;
    const notebook = notebooks.get(portalDisplayMutation.id);
    if (notebook) {
      notebook.portalDisplay = portalDisplayMutation.portalDisplay;
      set((_state: NotebookState) => ({ notebooks }));
    }
  },
}));

export function useNotebookStore(): NotebookState;
export function useNotebookStore<T>(selector: (state: NotebookState) => T): T;
export function useNotebookStore<T>(selector?: (state: NotebookState) => T) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useStore(notebookStore, selector!);
}

export default useNotebookStore;
