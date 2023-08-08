import { INotebookContent } from '@jupyterlab/nbformat';
import InputViewer from './input/InputViewer';
import OutputViewer from './output/OutputViewer';
import { newUuid } from './../../jupyter/utils/Ids';

type Props = {
  nbformat: INotebookContent
}

const Viewer = (props: Props) => {
  const { nbformat } = props;
  return (
    <>
      {nbformat.cells.map(cell => {
        return (
          <div key={cell.id?.toString() || newUuid()}>
            <InputViewer cell={cell} languageInfo={nbformat.metadata.language_info}/>
            <OutputViewer cell={cell}/>
          </div>
        )
      })}
    </>
  );
}

export default Viewer;
