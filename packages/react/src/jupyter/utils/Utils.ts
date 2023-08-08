import { ICell } from '@jupyterlab/nbformat';

export const sourceAsString = (cell: ICell) => {
  let source = cell.source;
  if (typeof(source) === 'object') {
    source = (source as []).join('\n')
  }
  return source;
}
