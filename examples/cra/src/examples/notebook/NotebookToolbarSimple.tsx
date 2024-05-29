/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Box, IconButton, Text, Tooltip } from '@primer/react';
import { PlayIcon, FileIcon, ThreeBarsIcon } from '@primer/octicons-react';
import { useNotebookStore } from '@datalayer/jupyter-react';

const NotebookToolbarSimple = (props: {notebookId: string}) => {
  const { notebookId } = props;
  const notebookStore = useNotebookStore();
  return (
    <>
      <Text as="h3">Notebook Example</Text>
      <Box display="flex">
        <Box
          display="flex"
          alignItems="center"
          sx={{ gap: "0.5rem" }}
        >
          <IconButton
            aria-label="Search"
            icon={ThreeBarsIcon}
            size="small"
            variant="invisible"
          />
          <Text>Notebook Toolbar</Text>
        </Box>
        <Tooltip aria-label="Run the cell">
          <IconButton
            size="small"
            variant="invisible"
            icon={PlayIcon}
            aria-label="Run the cell"
            onClick={() => notebookStore.run(notebookId)}
          />
        </Tooltip>
        <Tooltip aria-label="Save the notebook">
          <IconButton
            size="small"
            variant="invisible"
            icon={FileIcon}
            aria-label="Save"
            onClick={() => notebookStore.save({uid: notebookId, date: new Date()}) }
          />
        </Tooltip>
      </Box>
    </>
  );
}

export default NotebookToolbarSimple;
