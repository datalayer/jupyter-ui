import { useMemo, useEffect } from 'react';
import { useDispatch, useStore } from "react-redux";
import { CodeCell } from '@jupyterlab/cells';
import { KernelMessage } from '@jupyterlab/services';
import { cellEpics, cellActions, cellReducer } from './CellState';
import CellAdapter from './CellAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';
import { asObservable } from '../../lumino/LuminoObservable';
// import { map } from "rxjs/operators";
// import KernelModel from './KernelModel';

const DEFAULT_SOURCE = `from IPython.display import display

for i in range(10):
    display('String {} added to the DOM in separated DIV.'.format(i))`

export type ICellProps = {
  source?: string;
  autoStart?: boolean;
}

const CellLumino = (props: ICellProps) => {
  const cellLumino = useMemo(() => new CellAdapter(props.source!), []);
  const dispatch = useDispatch();
  const injectableStore = useStore();  
  useEffect(() => {
    cellLumino.codeCell.model.value.changed.connect((sender, changedArgs) => {
      dispatch(cellActions.source.started(sender.text));
    });
    const outputs$ = asObservable(cellLumino.codeCell.outputArea.outputLengthChanged);
    outputs$.subscribe(
      outputsCount => { dispatch(cellActions.outputsCount.started(outputsCount)); }
    );
//    outputs$.pipe(map(output => { console.log('---- output', output); }));
    (injectableStore as any).injectReducer('cell', cellReducer);
    (injectableStore as any).injectEpic(cellEpics(cellLumino));
    dispatch(cellActions.source.started(props.source!));
    cellLumino.sessionContext.initialize().then(() => {
//      const kernelModel = new KernelModel(cellLumino.sessionContext);
//      kernelModel.execute(props.source!);
      if (props.autoStart) {
        const executePromise = CodeCell.execute(cellLumino.codeCell, cellLumino.sessionContext);
        executePromise.then((msg: void | KernelMessage.IExecuteReplyMsg) => {
          dispatch(cellActions.update.started({
            kernelAvailable: true,
          }));
        });  
      }
    });
  }, []);
  return <LuminoAttached>{cellLumino.panel}</LuminoAttached>
}

CellLumino.defaultProps = {
  source: DEFAULT_SOURCE,
  autoStart: true,
} as Partial<ICellProps>;

export default CellLumino;
