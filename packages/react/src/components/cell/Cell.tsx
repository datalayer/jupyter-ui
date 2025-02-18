/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { Box } from '@primer/react';
import { useJupyter } from './../../jupyter';
import Kernel from '../../jupyter/kernel/Kernel';
import { newUuid } from '../../utils';
import { Lumino } from '../lumino';
import { CellAdapter } from './CellAdapter';
import { useCellsStore } from './CellState';

export type ICellProps = {
  /**
   * Whether to execute directly the code cell or not.
   */
  autoStart?: boolean;
  /**
   * An id that can be provided to identify unique cell
   */
  id: string;
  /**
   * Cell source
   */
  source?: string;
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
  type: 'code' | 'markdown' | 'raw';
  /**
   * Custom kernel for the cell. Falls back to the defaultKernel if not provided.
   */
  kernel?: Kernel;
};

export const Cell = (props: ICellProps) => {
  const {
    autoStart,
    showToolbar,
    source = '',
    startDefaultKernel,
    type,
    kernel: customKernel,
  } = props;
  const { defaultKernel, serverSettings, kernelIsLoading } = useJupyter({
    startDefaultKernel,
  });
  const [id] = useState(props.id || newUuid());
  const [adapter, setAdapter] = useState<CellAdapter>();
  const cellsStore = useCellsStore();
  const handleCellInitEvents = (adapter: CellAdapter) => {
    adapter.cell.model.contentChanged.connect(
      (cellModel, changedArgs) => {
        cellsStore.setSource(id, cellModel.sharedModel.getSource());
      }
    );
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
      })
    });
  }
  useEffect(() => {
    const kernelToUse = customKernel || defaultKernel;
    if (id && serverSettings && kernelToUse) {
      kernelToUse.ready.then(() => {
        const adapter = new CellAdapter({
          id,
          type,
          source,
          serverSettings,
          kernel: kernelToUse,
          boxOptions: {showToolbar}
        });
        cellsStore.setAdapter(id, adapter);
        cellsStore.setSource(id, source);
        handleCellInitEvents(adapter);
        setAdapter(adapter);
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
  }, [source, defaultKernel, customKernel, serverSettings]);
  return adapter && !kernelIsLoading ? (
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
          paddingBottom: '30px',
        },
        '& .jp-CodeMirrorEditor': {
          cursor: 'text !important',
        },
      }}
    >
      <Lumino>
        {adapter.panel}
      </Lumino>
    </Box>
  ) : (
    <Box>
      Loading Jupyter Cell...
    </Box>
  );
};

Cell.defaultProps = {
  autoStart: true,
  showToolbar:true,
  startDefaultKernel: true,
  type: 'code',
} as Partial<ICellProps>;

export default Cell;
