/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { TocLayoutFactory } from './TocExtension';
import { TableOfContents } from '@jupyterlab/toc';
import { BoxPanel } from '@lumino/widgets';
import { Box } from '@datalayer/primer-addons';
import { TocTree } from './TocComponent';

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
        <TocTree notebookId={notebookId} />
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
