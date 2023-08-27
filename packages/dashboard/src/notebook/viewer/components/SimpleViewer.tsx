import { useState } from 'react';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import Viewer from '@datalayer/jupyter-react/lib/components/viewer/Viewer';

type Props = {
  context: DocumentRegistry.IContext<INotebookModel>,
}

const SimpleViewer = (props: Props) => {
  const { context } = props;
  const [model, setModel] = useState(context.model.sharedModel.toJSON());
  context.model.contentChanged.connect((model, _) => {
    setModel(model.sharedModel.toJSON());
  });
  return (
    <>
      <Viewer nbformat={model} outputs={false} />
    </>
  )
}

export default SimpleViewer;
