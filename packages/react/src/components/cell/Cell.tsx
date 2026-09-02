/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { ICell, IOutput } from '@jupyterlab/nbformat';
import { Spinner } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { Kernel } from '../../jupyter/kernel/Kernel';
import { newUuid } from '../../utils';
import { Lumino } from '../lumino';
import { CellAdapter } from './CellAdapter';
import { useCellsStore } from './CellState';
import { InputViewer } from '../viewer/input/InputViewer';
import { OutputViewer } from '../viewer/output/OutputViewer';

export type ICellProps = {
  /**
   * Whether to execute directly the code cell or not.
   */
  autoStart?: boolean;
  /**
   * An id that can be provided to identify unique cell
   */
  id?: string;
  /**
   * Cell source
   */
  source?: string;
  /**
   * Initial Outputs
   */
  outputs?: IOutput[];
  /**
   * Whether to start the default kernel or not
   */
  startDefaultKernel?: boolean;
  /**
   * Whether to show the toolbar for cell or not
   */
  showToolbar?: boolean;
  /**
   * Cell type
   */
  type?: 'code' | 'markdown' | 'raw';
  /**
   * Custom kernel for the cell.
   */
  kernel?: Kernel;
  /**
   * Render the cell read-only: the source and the given outputs, statically.
   *
   * No kernel, no session, no adapter — the same rendering path as the
   * notebook `Viewer`, packaged per cell. For showing a cell that already
   * ran somewhere else (a chat transcript, a report) where an editable cell
   * wired to nothing would be a lie. `kernel`, `autoStart` and `showToolbar`
   * are ignored in this mode.
   */
  readOnly?: boolean;
};

export const Cell = ({
  autoStart = true,
  id: providedId,
  kernel,
  outputs = [],
  readOnly = false,
  showToolbar = true,
  source = '',
  type = 'code',
}: ICellProps) => {
  const [id] = useState(providedId || newUuid());
  const [adapter, setAdapter] = useState<CellAdapter>();
  const cellsStore = useCellsStore();
  // Use refs to prevent multiple adapter creations
  const adapterCreatingRef = useRef(false);
  const handleCellInitEvents = (adapter: CellAdapter) => {
    adapter.cell.model.contentChanged.connect((cellModel, _) => {
      cellsStore.setSource(id, cellModel.sharedModel.getSource());
    });
    if (adapter.cell instanceof CodeCell) {
      adapter.cell.outputArea.outputLengthChanged?.connect(
        (outputArea, outputsCount) => {
          cellsStore.setOutputsCount(id, outputsCount);
        }
      );
    }
    adapter.sessionContext.initialize().then(() => {
      if (autoStart && adapter.cell.model) {
        // Perform auto-start for code or markdown cells.
        adapter.execute();
      }
    });
    adapter.sessionContext.kernelChanged.connect(() => {
      void adapter.sessionContext.session?.kernel?.info.then(info => {
        // Set that session/kernel is ready for this cell when the kernel is guaranteed to be connected
        cellsStore.setKernelSessionAvailable(id, true);
      });
    });
  };
  useEffect(() => {
    // Guard against multiple adapter creations using a ref
    if (!adapter && !adapterCreatingRef.current && kernel) {
      adapterCreatingRef.current = true;
      kernel.ready.then(() => {
        const adapter = new CellAdapter({
          id,
          type,
          source,
          outputs,
          kernel,
          boxOptions: { showToolbar },
        });
        setAdapter(adapter);
        cellsStore.setAdapter(id, adapter);
        cellsStore.setSource(id, source);
        handleCellInitEvents(adapter);
        const handleDblClick = (event: Event) => {
          let target = event.target as HTMLElement;
          /**
           * Find the DOM searching by the markdown output class (since child elements can be clicked also)
           * If a rendered markdown was found, then back cell to editor mode
           */
          while (target && !target.classList.contains('jp-MarkdownOutput')) {
            target = target.parentElement as HTMLElement;
          }
          if (target && target.classList.contains('jp-MarkdownOutput')) {
            (adapter.cell as MarkdownCell).rendered = false;
          }
        };
        // Adds the event for double click and the removal on component's destroy
        document.addEventListener('dblclick', handleDblClick);
        return () => {
          document.removeEventListener('dblclick', handleDblClick);
        };
      });
    }
  }, [source, kernel]);
  /* Built unconditionally so the hook order is stable; costs a small object
     when unused. `metadata.editable: false` is what the JupyterLab cell
     reads to refuse edits — the same convention the notebook Viewer uses. */
  const readOnlyCell = useMemo<ICell>(
    () =>
      ({
        cell_type: type,
        source,
        metadata: { editable: false, trusted: true },
        ...(type === 'code' ? { outputs, execution_count: null } : {}),
      }) as ICell,
    [type, source, outputs]
  );
  if (readOnly) {
    return (
      <Box className="dla-Jupyter-ReadOnlyCell">
        <InputViewer cell={readOnlyCell} />
        {type === 'code' && (readOnlyCell.outputs as IOutput[])?.length ? (
          <OutputViewer cell={readOnlyCell} />
        ) : null}
      </Box>
    );
  }
  return adapter ? (
    <Box
      sx={{
        '& .dla-Jupyter-Cell': {
          position: 'relative !important' as any,
          contain: 'content !important' as any,
        },
        '& .jp-Toolbar': {
          height: 'auto !important',
          position: 'relative',
        },
        '& .lm-BoxPanel': {
          position: 'relative',
        },
        '& .jp-Cell': {
          position: 'relative',
        },
        '& .jp-CodeCell': {
          height: 'auto !important',
          position: 'relative',
        },
        '& .jp-MarkdownCell': {
          height: 'auto !important',
          minHeight: '65px',
          position: 'relative',
        },
        '& .jp-Cell-outputArea': {
          paddingBottom: '2px',
        },
        '& .jp-CodeMirrorEditor': {
          cursor: 'text !important',
        },
      }}
    >
      <Lumino>{adapter.panel}</Lumino>
    </Box>
  ) : (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 4,
      }}
    >
      <Spinner size="medium" />
    </Box>
  );
};

export default Cell;
