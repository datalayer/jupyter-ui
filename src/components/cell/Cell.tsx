import { useMemo, useEffect } from 'react';
import { useDispatch } from "react-redux";
import { CodeCell } from '@jupyterlab/cells';
import { KernelMessage } from '@jupyterlab/services';
import { cellActions } from './CellState';
import CellAdapter from './CellAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

import '@jupyterlab/application/style/index.css';
import '@jupyterlab/cells/style/index.css';
import '@jupyterlab/completer/style/index.css';
// This should be only index.css, looks like jupyterlab has a regression here...
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

import './Cell.css';

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(10):
    display('String {} added to the DOM in separated DIV.'.format(i))`

export type ICellProps = {
  source?: string;
  autoStart?: boolean;
}

const Cell = (props: ICellProps) => {
  const adapter = useMemo(() => new CellAdapter(props.source!), []);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(cellActions.update({ adapter }));
    dispatch(cellActions.source(props.source!));
    adapter.codeCell.model.value.changed.connect((sender, changedArgs) => {
      dispatch(cellActions.source(sender.text));
    });
    adapter.codeCell.outputArea.outputLengthChanged.connect((_, outputsCount) => {
      dispatch(cellActions.outputsCount(outputsCount));
    });
    adapter.sessionContext.initialize().then(() => {
      if (props.autoStart) {
        const executePromise = CodeCell.execute(adapter.codeCell, adapter.sessionContext);
        executePromise.then((msg: void | KernelMessage.IExecuteReplyMsg) => {
          dispatch(cellActions.update({
            kernelAvailable: true,
          }));
        });  
      }
    });
  }, []);
  return <LuminoAttached>{adapter.panel}</LuminoAttached>
}

Cell.defaultProps = {
  source: DEFAULT_SOURCE,
  autoStart: true,
} as Partial<ICellProps>;

export default Cell;
