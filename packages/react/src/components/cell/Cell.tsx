import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from "react-redux";
import { CodeCell } from '@jupyterlab/cells';
import { KernelMessage } from '@jupyterlab/services';
import { useJupyter } from './../../jupyter/JupyterContext';
import Lumino from '../../jupyter/lumino/Lumino';
import { cellActions, cellReducer } from './CellState';
import CellAdapter from './CellAdapter';

import './Cell.css';

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(10):
    display('String {} added to the DOM in separated DIV.'.format(i))`

export type ICellProps = {
  source?: string;
  autoStart?: boolean;
}

export const Cell = (props: ICellProps) => {
  const { source, autoStart } = props;
  const { serverSettings, injectableStore } = useJupyter();
  const dispatch = useDispatch();
  const [adapter, setAdapter] = useState<CellAdapter>();
  useMemo(() => {
    (injectableStore as any).inject('cell', cellReducer);
  }, []);
  useEffect(() => {
    if (source) {
      const adapter = new CellAdapter(source, serverSettings);
      dispatch(cellActions.update({ adapter }));
      dispatch(cellActions.source(props.source!));
      adapter.codeCell.model.contentChanged.connect((cellModel, changedArgs) => {
        dispatch(cellActions.source(cellModel.sharedModel.getSource()));
      });
      adapter.codeCell.outputArea.outputLengthChanged.connect((outputArea, outputsCount) => {
        dispatch(cellActions.outputsCount(outputsCount));
      });
      adapter.sessionContext.initialize().then(() => {
        if (autoStart) {
          const execute = CodeCell.execute(adapter.codeCell, adapter.sessionContext);
          execute.then((msg: void | KernelMessage.IExecuteReplyMsg) => {
            dispatch(cellActions.update({
              kernelAvailable: true,
            }));
          });
        }
      });
      setAdapter(adapter);  
    }
  }, [source]);
  return adapter
    ?
      <Lumino>
        {adapter.panel}
      </Lumino>
    :
      <>Loading Jupyter Cell...</>
}

Cell.defaultProps = {
  source: DEFAULT_SOURCE,
  autoStart: true,
} as Partial<ICellProps>;

export default Cell;
