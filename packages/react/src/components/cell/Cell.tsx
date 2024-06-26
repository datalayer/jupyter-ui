/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { CodeCell } from '@jupyterlab/cells';
import { KernelMessage } from '@jupyterlab/services';
import { Box } from '@primer/react';
import CellAdapter from './CellAdapter';
import Lumino from '../lumino/Lumino';
import { useJupyter } from './../../jupyter/JupyterContext';
import useCellStore from './CellState';

export type ICellProps = {
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
};

export const Cell = (props: ICellProps) => {
  const { type='code', source = '', autoStart } = props;
  const { serverSettings, defaultKernel } = useJupyter();
  const cellStore = useCellStore();
  const [adapter, setAdapter] = useState<CellAdapter>();

  const handleCodeCellState = (adapter: CellAdapter) => {
    (adapter.codeCell as CodeCell).outputArea.outputLengthChanged?.connect(
      (outputArea, outputsCount) => {
        cellStore.setOutputsCount(outputsCount);
      }
    );
    adapter.sessionContext.initialize().then(() => {
      if (autoStart) {
        const execute = CodeCell.execute(
          (adapter.codeCell as CodeCell),
          adapter.sessionContext
        );
        execute.then((msg: void | KernelMessage.IExecuteReplyMsg) => {
          cellStore.setKernelAvailable(true);
        });
      }
    });
  }

  useEffect(() => {
    if (defaultKernel && serverSettings) {
      defaultKernel.ready.then(() => {
        const adapter = new CellAdapter({
          type,
          source,
          serverSettings,
          kernel: defaultKernel,
        });
        cellStore.setAdapter(adapter);
        cellStore.setSource(source);
        adapter.codeCell.model.contentChanged.connect(
          (cellModel, changedArgs) => {
            cellStore.setSource(cellModel.sharedModel.getSource());
          }
        );

        if (type === 'code') {
          handleCodeCellState(adapter);
        }
        setAdapter(adapter);
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
