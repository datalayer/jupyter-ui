import { ICell, IOutput } from '@jupyterlab/nbformat';
import Lumino from '../../../jupyter/lumino/Lumino';
import OutputAdapter from './OutputAdapter';

type Props = {
  cell: ICell,
}

export const OutputViewer = (props: Props) => {
  const { cell } = props;
  const outputs = cell.outputs ? (cell.outputs as IOutput[]) : undefined;
  const outputAdapter = new OutputAdapter(outputs);
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

export default OutputViewer;
