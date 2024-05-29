/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { Box, IconButton, Text, Tooltip } from '@primer/react';
import { PlayIcon, ReplyIcon, ThreeBarsIcon } from '@primer/octicons-react';
import { useCellStore } from '@datalayer/jupyter-react';

const CellToolbar: React.FC = () => {
  const cellStore = useCellStore();
  const outputsCount = cellStore.outputsCount;
  return (
    <>
      <Text as="h3">Cell Example</Text>
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
          <Text>Cell Toolbar</Text>
        </Box>
        <Tooltip aria-label="Run the cell">
          <IconButton
            size="small"
            variant="invisible"
            icon={PlayIcon}
            aria-label="Run the cell"
            onClick={() => cellStore.execute()}
          />
        </Tooltip>
        <Tooltip aria-label="Run the cell">
          <IconButton
            size="small"
            variant="invisible"
            icon={ReplyIcon}
            aria-label="Rest the outputcount"
            onClick={() => cellStore.setOutputsCount(0)}
          />
        </Tooltip>
      </Box>
      <Text as="h4">Outputs count: {outputsCount}</Text>
    </>
  );
};

export default CellToolbar;
