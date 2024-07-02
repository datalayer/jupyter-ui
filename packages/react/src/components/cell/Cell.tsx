/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { KernelMessage } from '@jupyterlab/services';
import { Box } from '@primer/react';
import CellAdapter from './CellAdapter';
import { UUID } from '@lumino/coreutils';
import Lumino from '../lumino/Lumino';
import { useJupyter } from './../../jupyter/JupyterContext';
import useCellStore from './CellState';

export type ICellProps = {
  sourceId?: string;
  /**
   * Cell type
   */
  type: 'code' | 'markdown' | 'raw';

  /**
   * Cell source
   */
  source?: string;
  /**
   * Whether to execute directly the code cell or not.
   */
  autoStart?: boolean;
  /**
   * Whether to show the toolbar for cell or not
   */
  showToolbar?: boolean;
};

export const Cell = (props: ICellProps) => {
  const { sourceId, type='code', source = '', autoStart, showToolbar=true } = props;
  const { serverSettings, defaultKernel } = useJupyter();
  const [id, setId] = useState<string | undefined>(sourceId);
  const cellStore = useCellStore();
  const [adapter, setAdapter] = useState<CellAdapter>();

  useEffect(() => {
    if (!id) {
      setId(UUID.uuid4());
    }
  }, []);

  const handleCellInitEvents = (adapter: CellAdapter) => {
    if(!id) {
      return;
    }

    adapter.cell.model.contentChanged.connect(
      (cellModel, changedArgs) => {
        cellStore.setSource(id, cellModel.sharedModel.getSource());
      }
    );

    if (adapter.cell instanceof CodeCell) {
      adapter.cell.outputArea.outputLengthChanged?.connect(
        (outputArea, outputsCount) => {
          cellStore.setOutputsCount(id, outputsCount);
        }
      );
    }

    adapter.sessionContext.initialize().then(() => {
      if (!autoStart) {
        return
      }

      // Perform auto-start for code or markdown cells
      if (adapter.cell instanceof CodeCell) {
        const execute = CodeCell.execute(
          adapter.cell,
          adapter.sessionContext
        );
        // execute.then((msg: void | KernelMessage.IExecuteReplyMsg) => {
        //   cellStore.setKernelAvailable(true);
        // });
      }

      if (adapter.cell instanceof MarkdownCell) {
        adapter.cell.rendered = true;
      }
    });
  }

  useEffect(() => {
    if (id && defaultKernel && serverSettings) {
      defaultKernel.ready.then(() => {
        const adapter = new CellAdapter({
          type,
          source,
          serverSettings,
          kernel: defaultKernel,
          boxOptions: {showToolbar}
        });
        cellStore.setAdapter(id, adapter);
        cellStore.setSource(id, source);
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
  }, [source, defaultKernel, serverSettings]);
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
  source: '',
  autoStart: true,
} as Partial<ICellProps>;

export default Cell;
