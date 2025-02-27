/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { type CommandRegistry } from '@lumino/commands';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  SquareIcon,
  XIcon,
} from '@primer/octicons-react';
import { ActionMenu, Box, Button } from '@primer/react';
import { NotebookCommandIds } from '../../NotebookCommands';
import CellMetadataEditor from '../metadata/CellMetadataEditor';
import type { ICellModel } from '@jupyterlab/cells';

/**
 * Cell sidebar class name.
 */
export const DATALAYER_CELL_SIDEBAR_CLASS_NAME = 'dla-CellSidebar-Container';

/**
 * Cell sidebar properties
 */
export type ICellSidebarProps = {
  /**
   * Notebook command registry
   */
  commands: CommandRegistry;
  /**
   * Cell model
   */
  model: ICellModel;
  /**
   * Whether to display nbgrader features or not.
   */
  nbgrader: boolean;
};

/**
 * Cell sidebar component
 */
export function CellSidebar(props: ICellSidebarProps): JSX.Element {
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
      <Button
        title="Run cell"
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
        title="Insert code cell above"
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
        Code
      </Button>
      <Button
        title="Insert markdown cell above"
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
          title="Convert to markdow cell"
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
          title="Convert to code cell"
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
        title="Insert markdown cell below"
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
        title="Insert code cell below"
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
        Code
      </Button>
      <Button
        title="Delete cell"
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
    </Box>
  );
}

export default CellSidebar;
