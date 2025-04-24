/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ChevronDownIcon, ChevronUpIcon, PlayIcon, SquareIcon, XIcon } from '@primer/octicons-react';
import { Box, IconButton } from '@primer/react';
import { NotebookCommandIds } from '../../NotebookCommands';
import { DATALAYER_CELL_SIDEBAR_CLASS_NAME, ICellSidebarProps } from './CellSidebar';

export function CellSidebarButton(props: ICellSidebarProps): JSX.Element {
  const { commands, model } = props;
  return (
    <Box
      className={DATALAYER_CELL_SIDEBAR_CLASS_NAME}
      sx={{
        '& p': {
          marginBottom: '0 !important',
        },
      }}
    >
      <IconButton
        size="small"
        color="secondary"
        aria-label="Run cell"
        title="Run cell"
        onClick={e => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.run).catch(reason => {
            console.error('Failed to run cell.', reason);
          });
        }}
        icon={PlayIcon}
        variant="invisible"
      />
      <IconButton
        size="small"
        color="secondary"
        aria-label="Add code cell above"
        title="Add code cell above"
        onClick={e => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.insertAbove).catch(reason => {
            console.error('Failed to insert code cell above.', reason);
          });
        }}
        icon={ChevronUpIcon}
        variant="invisible"
      />
      <IconButton
        size="small"
        color="secondary"
        aria-label="Add markdown cell above"
        title="Add markdown cell above"
        onClick={e => {
          e.preventDefault();
          commands
            .execute(NotebookCommandIds.insertAbove, { cellType: 'markdown' })
            .catch(reason => {
              console.error('Failed to insert markdown cell above.', reason);
            });
        }}
        icon={ChevronUpIcon}
        variant="invisible"
      />
      {model.type === 'code' ? (
        <IconButton
          aria-label="Convert to markdow cell"
          title="Convert to markdow cell"
          icon={SquareIcon}
          size="small"
          variant="invisible"
          onClick={e => {
            e.preventDefault();
            commands
              .execute(NotebookCommandIds.changeCellTypeToMarkdown)
              .catch(reason => {
                console.error(
                  'Failed to change cell type to markdown.',
                  reason
                );
              });
          }}
        />
      ) : (
        <IconButton
          aria-label="Convert to code cell"
          title="Convert to code cell"
          icon={SquareIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            commands
              .execute(NotebookCommandIds.changeCellTypeToCode)
              .catch(reason => {
                console.error('Failed to change cell type to code.', reason);
              });
          }}
        />
      )}
      <IconButton
        size="small"
        color="secondary"
        aria-label="Add markdown cell below"
        title="Add markdown cell below"
        onClick={e => {
          e.preventDefault();
          commands
            .execute(NotebookCommandIds.insertBelow, { cellType: 'markdown' })
            .catch(reason => {
              console.error('Failed to insert markdown cell below.', reason);
            });
        }}
        icon={ChevronDownIcon}
        variant="invisible"
      />
      <IconButton
        size="small"
        color="secondary"
        aria-label="Add code cell above"
        title="Add code cell above"
        onClick={e => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.insertBelow).catch(reason => {
            console.error('Failed to insert code cell below.', reason);
          });
        }}
        icon={ChevronDownIcon}
        variant="invisible"
      />
      <IconButton
        size="small"
        color="error"
        aria-label="Delete cell"
        title="Delete cell"
        onClick={e => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.deleteCells).catch(reason => {
            console.error('Failed to delete cells.', reason);
          });
        }}
        icon={XIcon}
        variant="invisible"
      />
    </Box>
  );
}

export default CellSidebarButton;
