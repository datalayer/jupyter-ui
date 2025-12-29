/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CodeCell } from '@jupyterlab/cells';
import { IconButton } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import {
  PlayIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SquareIcon,
  XIcon,
} from '@primer/octicons-react';
import { useNotebookStore, INotebookExtensionProps } from '../../../components';

type ICellToolbarComponentProps = {
  cell: CodeCell;
  extensionProps: INotebookExtensionProps;
};

export const CellToolbarComponent = (props: ICellToolbarComponentProps) => {
  const { extensionProps } = props;
  const notebookId = extensionProps.notebookId;
  const notebookStore = useNotebookStore();
  // const activeCell = notebookStore.selectActiveCell(notebookId);
  const activeCell = undefined;
  return activeCell ? (
    <Box
      display="flex"
      sx={{
        marginLeft: 70,
      }}
    >
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Run cell"
          title="Run cell"
          onClick={e => {
            e.preventDefault();
            notebookStore.run(notebookId);
          }}
          icon={PlayIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add code cell above"
          title="Add code cell above"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertAbove(
              notebookId,
              'code',
            );
          }}
          icon={ChevronUpIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add markdown cell above"
          title="Add markdown cell above"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertAbove(
              notebookId,
              'markdown',
            );
          }}
          icon={ChevronUpIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        {(activeCell as any).model.type === 'code' ? (
          <IconButton
            aria-label="Convert to markdow cell"
            title="Convert to markdow cell"
            icon={SquareIcon}
            size="small"
            variant="invisible"
            onClick={e => {
              e.preventDefault();
              notebookStore.changeCellType(
                notebookId,
                'markdown',
              );
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
              notebookStore.changeCellType(
                notebookId,
                'code',
              );
            }}
          />
        )}
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add markdown cell below"
          title="Add markdown cell below"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertBelow(
              notebookId,
              'markdown',
            );
          }}
          icon={ChevronDownIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add code cell below"
          title="Add code cell below"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertBelow(
              notebookId,
              'code',
            );
          }}
          icon={ChevronDownIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="error"
          aria-label="Delete cell"
          title="Delete cell"
          onClick={e => {
            e.preventDefault();
            notebookStore.delete(notebookId);
          }}
          icon={XIcon}
          variant="invisible"
        />
      </Box>
    </Box>
  ) : (
    <></>
  );
};

export default CellToolbarComponent;
