/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PlayIcon } from '@primer/octicons-react';
import { Box, Button } from '@primer/react';
import { NotebookCommandIds } from '../../NotebookCommands';
import {
  DATALAYER_CELL_SIDEBAR_CLASS_NAME,
  ICellSidebarProps,
} from './CellSidebar';

export function CellSidebarRun(props: ICellSidebarProps): JSX.Element {
  const { commands } = props;
  return (
    <Box
      className={DATALAYER_CELL_SIDEBAR_CLASS_NAME}
      sx={{
        '& p': {
          marginBottom: '0 !important',
        },
      }}
    >
      <Button
        trailingVisual={PlayIcon}
        size="small"
        variant="invisible"
        onClick={(e: any) => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.run).catch(reason => {
            console.error('Failed to run cell.', reason);
          });
        }}
      >
        Run
      </Button>
    </Box>
  );
}

export default CellSidebarRun;
