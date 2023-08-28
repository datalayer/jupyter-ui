import { INotebookContent, ICell } from '@jupyterlab/nbformat';
import { ILayout, IConfig } from './Types';

export const loadSpecs = () => {
  const notebook = document.getElementById('datalayer-dashboard-notebook');
  const layout = document.getElementById('datalayer-dashboard-layout');
  const config = document.getElementById('datalayer-dashboard-config');
  return {
    notebook: notebook ? JSON.parse(notebook!.textContent!) as INotebookContent : undefined,
    layout: JSON.parse(layout!.textContent!) as ILayout,
    config: JSON.parse(config!.textContent!) as IConfig,
  }
}

// TODO Use a Map for performance.
export const getCell = (cellId: string, notebook: INotebookContent): ICell | undefined => {
  let cell: ICell | undefined = undefined;
  notebook.cells.forEach( c => {
    const metadata = c.metadata['jupyter_dashboard'] as any;
    if (metadata && (metadata["id"] === cellId)) {
      cell = c;
    }
  });
  return cell;
}
