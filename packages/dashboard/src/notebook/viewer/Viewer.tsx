import { useState } from 'react';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { Viewer as JupyterReactViewer} from '@datalayer/jupyter-react/lib/components/viewer/Viewer';

type Props = {
  context: DocumentRegistry.IContext<INotebookModel>,
}

const Viewer = (props: Props) => {
  const { context } = props;
  const [model, setModel] = useState(context.model.sharedModel.toJSON());
  context.model.contentChanged.connect((model, _) => {
    setModel(model.sharedModel.toJSON());
  });
  return (
    <>
      <JupyterReactViewer nbformat={model} outputs={false} />
    </>
  )
}

export default Viewer;
