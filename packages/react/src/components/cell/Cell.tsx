/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { CodeCell } from '@jupyterlab/cells';
import { KernelMessage } from '@jupyterlab/services';
import { Box } from '@primer/react';
import { cellActions, cellReducer } from './CellRedux';
import CellAdapter from './CellAdapter';
import Lumino from '../../jupyter/lumino/Lumino';
import { useJupyter } from './../../jupyter/JupyterContext';

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(10):
    display('String {} added to the DOM in separated DIV.'.format(i))`;

export type ICellProps = {
  source?: string;
  autoStart?: boolean;
};

export const Cell = (props: ICellProps) => {
  const { source, autoStart } = props;
  const { serverSettings, injectableStore, defaultKernel } = useJupyter();
  const dispatch = useDispatch();
  const [adapter, setAdapter] = useState<CellAdapter>();
  useMemo(() => {
    injectableStore.inject('cell', cellReducer);
  }, []);
  useEffect(() => {
    if (source && defaultKernel) {
      defaultKernel.ready.then(() => {
        const adapter = new CellAdapter({
          source,
          serverSettings,
          kernel: defaultKernel,
        });
        dispatch(cellActions.update({ adapter }));
        dispatch(cellActions.source(props.source!));
        adapter.codeCell.model.contentChanged.connect(
          (cellModel, changedArgs) => {
            dispatch(cellActions.source(cellModel.sharedModel.getSource()));
          }
        );
        adapter.codeCell.outputArea.outputLengthChanged.connect(
          (outputArea, outputsCount) => {
            dispatch(cellActions.outputsCount(outputsCount));
          }
        );
        adapter.sessionContext.initialize().then(() => {
          if (autoStart) {
            const execute = CodeCell.execute(
              adapter.codeCell,
              adapter.sessionContext
            );
            execute.then((msg: void | KernelMessage.IExecuteReplyMsg) => {
              dispatch(
                cellActions.update({
                  kernelAvailable: true,
                })
              );
            });
          }
        });
        setAdapter(adapter);
      });
    }
  }, [source, defaultKernel]);
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
        '& .jp-Cell-outputArea': {
          paddingBottom: '30px',
        },
        '& .jp-CodeMirrorEditor': {
          cursor: 'text !important',
        },
      }}
    >
      <Lumino>{adapter.panel}</Lumino>
    </Box>
  ) : (
    <Box>Loading Jupyter Cell...</Box>
  );
};

Cell.defaultProps = {
  source: DEFAULT_SOURCE,
  autoStart: true,
} as Partial<ICellProps>;

export default Cell;
