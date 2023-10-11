import { INotebookContent, ICell } from '@jupyterlab/nbformat';
import { IDashboardLayout, IDashboadConfig } from '../types/DashboardTypes';

export const loadDasbhoardSpecs = () => {
  const notebook = document.getElementById('datalayer-dashboard-notebook');
  const layout = document.getElementById('datalayer-dashboard-layout');
  const config = document.getElementById('datalayer-dashboard-config');
  return {
    notebook: notebook ? JSON.parse(notebook!.textContent!) as INotebookContent : undefined,
    layout: JSON.parse(layout!.textContent!) as IDashboardLayout,
    config: JSON.parse(config!.textContent!) as IDashboadConfig,
  }
}

// TODO Use a Map for performance.
export const getDashboardCell = (cellId: string, notebook: INotebookContent): ICell | undefined => {
  let cell: ICell | undefined = undefined;
  notebook.cells.forEach( c => {
    const metadata = c.metadata['jupyter_dashboard'] as any;
    if (metadata && (metadata["id"] === cellId)) {
      cell = c;
    }
  });
  return cell;
}
