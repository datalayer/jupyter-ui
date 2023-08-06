import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { ReactWidget } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ThemeProvider, BaseStyles, Text, Box } from '@primer/react'
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

class NotebookHeader extends ReactWidget {
  render() {
    return (
      <ThemeProvider>
        <BaseStyles>
          <Box>
            <Text as="p" sx={{color: 'fg.onEmphasis', bg: 'neutral.emphasis', p: 2, m: 0}}>
              🚧 Datalayer Notebook
            </Text>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    );
  }
}

export class NotebookHeaderExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  createNew(panel: NotebookPanel, _: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    const notebookHeader = new NotebookHeader();
    notebookHeader.addClass('dla-Notebook-header');
    panel.contentHeader.insertWidget(0, notebookHeader);
//    panel.content.model = null;
    return new DisposableDelegate(() => {
      notebookHeader.dispose();
    });
  }
}
