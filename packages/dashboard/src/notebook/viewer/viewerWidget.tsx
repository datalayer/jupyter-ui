import { ReactWidget } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import Viewer from './Viewer';

class ViewerWidget extends ReactWidget {
  private _context: DocumentRegistry.IContext<INotebookModel>

  constructor(context: DocumentRegistry.IContext<INotebookModel>) {
    super();
    this._context = context;
  }

  render() {
    return (
      <ThemeProvider>
        <BaseStyles>
          <Box m={3}>
            <Viewer context={this._context}/>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    );
  }
}

export default ViewerWidget;
