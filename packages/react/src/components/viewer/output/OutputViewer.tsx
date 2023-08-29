import { ICell, IOutput } from '@jupyterlab/nbformat';
import Lumino from '../../../jupyter/lumino/Lumino';
import OutputAdapter from './OutputAdapter';

type Props = {
  cell: ICell,
  adaptPlotly: boolean,
}

export const OutputViewer = (props: Props) => {
  const { cell, adaptPlotly } = props;
  const outputs = cell.outputs ? (cell.outputs as IOutput[]) : undefined;
  const outputAdapter = new OutputAdapter(adaptPlotly, outputs);
  switch(cell.cell_type) {
    case 'code': {
      return (
        <>
          <Lumino>
            {outputAdapter.outputArea}
          </Lumino>
        </>
      );
    }
    default:
      return <></>
  }
}

OutputViewer.defaultProps = {
  adaptPlotly: false,
} as Partial<Props>;

export default OutputViewer;
