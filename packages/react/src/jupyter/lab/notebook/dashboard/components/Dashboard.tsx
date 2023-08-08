import { useState } from 'react';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import Viewer from './../../../../../components/viewer/Viewer';

type Props = {
  context: DocumentRegistry.IContext<INotebookModel>,
}

const Dashboard = (props: Props) => {
  const { context } = props;
  const [model, setModel] = useState(context.model.sharedModel.toJSON());
  context.model.contentChanged.connect((model, _) => {
    setModel(model.sharedModel.toJSON());
  });
  return (
    <>
      <Viewer nbformat={model}/>
    </>
  )
}

export default Dashboard;
