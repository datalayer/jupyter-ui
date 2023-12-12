/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import React from 'react';
import {useDispatch} from 'react-redux';
import { Box, IconButton, Text, Tooltip } from '@primer/react';
import { PlayIcon, ReplyIcon, ThreeBarsIcon } from '@primer/octicons-react';
import { Toolbar } from '@datalayer/primer-addons';
import { selectCell, cellActions } from '@datalayer/jupyter-react';

const CellToolbar: React.FC = () => {
  const cell = selectCell();
  const dispatch = useDispatch();
  return (
    <>
      <Text as="h3">Cell Example</Text>
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
            <Text>Cell Toolbar</Text>
          </Box>
        }
      >
        <Tooltip aria-label="Run the cell">
          <IconButton
            size="small"
            variant="invisible"
            icon={PlayIcon}
            aria-label="Run the cell"
            onClick={() => dispatch(cellActions.execute())}
          />
        </Tooltip>
        <Tooltip aria-label="Run the cell">
          <IconButton
            size="small"
            variant="invisible"
            icon={ReplyIcon}
            aria-label="Rest the outputcount"
            onClick={() => dispatch(cellActions.outputsCount(0))}
          />
        </Tooltip>
      </Toolbar>
      <Text as="h4">Outputs count: {cell.outputsCount}</Text>
    </>
  );
};

export default CellToolbar;
