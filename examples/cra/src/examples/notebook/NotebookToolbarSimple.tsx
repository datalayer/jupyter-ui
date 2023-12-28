/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useDispatch } from 'react-redux';
import { Box, IconButton, Text, Tooltip } from '@primer/react';
import { Toolbar } from '@datalayer/primer-addons';
import { PlayIcon, FileIcon, ThreeBarsIcon } from '@primer/octicons-react';
import { notebookActions } from '@datalayer/jupyter-react';

const NotebookToolbarSimple = (props: {notebookId: string}) => {
  const { notebookId } = props;
  const dispatch = useDispatch();
  return (
    <>
      <Text as="h3">Notebook Example</Text>
      <Toolbar
        heading={
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
        }
      >
        <Tooltip aria-label="Run the cell">
          <IconButton
            size="small"
            variant="invisible"
            icon={PlayIcon}
            aria-label="Run the cell"
            onClick={() => dispatch(notebookActions.run.started(notebookId))}
          />
        </Tooltip>
        <Tooltip aria-label="Save the notebook">
          <IconButton
            size="small"
            variant="invisible"
            icon={FileIcon}
            aria-label="Save"
            onClick={() =>
              dispatch(
                notebookActions.save.started({uid: notebookId, date: new Date()})
              )
            }
          />
        </Tooltip>
      </Toolbar>
    </>
  );
}

export default NotebookToolbarSimple;
