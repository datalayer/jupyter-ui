import { NotebookPanel } from '@jupyterlab/notebook';
import { TocLayoutFactory } from './TocExtension';
import { TableOfContents } from '@jupyterlab/toc';
import { BoxPanel } from '@lumino/widgets';
import TocComponent from './TocComponent';
import { Box } from '@primer/react';

/**
 * React ToC Layout Factory.
 */
export class ReactLayoutFactory implements TocLayoutFactory {
  constructor() {}

  layout(panel: BoxPanel, notebookPanel: NotebookPanel, notebookId: string) {
    return (
      <Box
        position="fixed"
        top="2.6rem"
        right={0}
        width="200px"
        height="100%"
        style={{
          float: 'right',
          zIndex: 1000,
        }}
      >
        <TocComponent notebookId={notebookId} />
      </Box>
    );
  }

  setModel(model: TableOfContents.Model) {
    // React will get model from notebookStore
  }

  dispose() {
    // React will dispose automatically
  }
}
