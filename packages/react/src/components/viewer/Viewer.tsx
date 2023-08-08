import { INotebookContent } from '@jupyterlab/nbformat';

type Props = {
  nbformat: INotebookContent
}
const Viewer = (props: Props) => {
  const { nbformat } = props;
  return (
    <>
      {nbformat.cells.map(cell => {
        return (
          <div key={cell.id?.toString()}>
            {cell.source}
          </div>
        )
      })}
    </>
  );
}

export default Viewer;
