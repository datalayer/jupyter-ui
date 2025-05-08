/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ActionMenu, Box, Button } from '@primer/react';
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, SquareIcon, XIcon } from '@primer/octicons-react';
import { NotebookCommandIds } from '../../../components/notebook';
import { CellMetadataEditor } from '../../../components/notebook/cell/metadata';
import { DATALAYER_CELL_SIDEBAR_CLASS_NAME, ICellSidebarProps } from '../../../components/notebook/cell/sidebar';

export const CellSidebarSource = (props: ICellSidebarProps) => {
  const { commands, model, nbgrader } = props;
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
        leadingVisual={ChevronRightIcon}
        variant="invisible"
        size="small"
        onClick={(e: any) => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.run).catch(reason => {
            console.error('Failed to run cell.', reason);
          });
        }}
      >
        Run
      </Button>
      <Button
        leadingVisual={ChevronUpIcon}
        variant="invisible"
        size="small"
        onClick={(e: any) => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.insertAbove).catch(reason => {
            console.error('Failed to insert code cell above.', reason);
          });
        }}
      >
        Code (with source)
      </Button>
      <Button
        leadingVisual={ChevronUpIcon}
        variant="invisible"
        size="small"
        onClick={(e: any) => {
          e.preventDefault();
          commands
            .execute(NotebookCommandIds.insertAbove, { cellType: 'markdown' })
            .catch(reason => {
              console.error('Failed to insert markdown cell above.', reason);
            });
        }}
      >
        Markdown
      </Button>
      {model.type === 'code' ? (
        <Button
          leadingVisual={SquareIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
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
        >
          To Markdown
        </Button>
      ) : (
        <Button
          leadingVisual={SquareIcon}
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
        >
          To Code
        </Button>
      )}
      <Button
        leadingVisual={ChevronDownIcon}
        variant="invisible"
        size="small"
        onClick={(e: any) => {
          e.preventDefault();
          commands
            .execute(NotebookCommandIds.insertBelow, { cellType: 'markdown' })
            .catch(reason => {
              console.error('Failed to insert markdown cell below.', reason);
            });
        }}
      >
        Markdown
      </Button>
      <Button
        leadingVisual={ChevronDownIcon}
        variant="invisible"
        size="small"
        onClick={(e: any) => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.insertBelow).catch(reason => {
            console.error('Failed to insert code cell below.', reason);
          });
        }}
      >
        Code (with source)
      </Button>
      <Button
        leadingVisual={XIcon}
        variant="invisible"
        size="small"
        onClick={(e: any) => {
          e.preventDefault();
          commands.execute(NotebookCommandIds.deleteCells).catch(reason => {
            console.error('Failed to delete cells.', reason);
          });
        }}
      >
        Delete
      </Button>
      {nbgrader && (
        <ActionMenu>
          {/*
            <ActionMenu.Anchor>
              <IconButton icon={KebabHorizontalIcon} variant="invisible" aria-label="Open column options" />
            </ActionMenu.Anchor>
            <ActionMenu.Overlay>
            */}
          <CellMetadataEditor cellModel={model} />
          {/*
            </ActionMenu.Overlay>
            */}
        </ActionMenu>
      )}
    </Box>
  );
};

export default CellSidebarSource;
