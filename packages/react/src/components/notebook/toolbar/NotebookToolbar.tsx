/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { Box, IconButton, Button, ButtonGroup } from '@primer/react';
import {
  PlusIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  ZapIcon,
  PaperAirplaneIcon,
} from '@primer/octicons-react';
import useNotebookStore from '../NotebookState';

export type INotebookToolbarProps = {
  notebookId: string;
};

export const NotebookToolbar = (props: INotebookToolbarProps) => {
  const { notebookId } = props;
  const notebookStore = useNotebookStore();
  const [type, setType] = useState('code');
  const kernelStatus = notebookStore.selectKernelStatus(notebookId);
  const handleChangeCellType = (newType: string) => {
    setType(newType);
  };
  return (
    <Box
      display="flex"
      pt={1}
      pb={1}
      sx={{
        width: '100%',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderColor: 'border.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '50%',
          paddingLeft: '7vw',
          gap: '0.75vw',
        }}
      >
        <IconButton
          variant="invisible"
          size="small"
          color="primary"
          aria-label="Save"
          title="Save"
          onClick={e => {
            e.preventDefault();
            notebookStore.save({
              id: notebookId,
              date: new Date(),
            });
          }}
          icon={ZapIcon}
        />
        <IconButton
          variant="invisible"
          size="small"
          color="secondary"
          aria-label="Run cell"
          title="Run cell"
          onClick={e => {
            e.preventDefault();
            notebookStore.run(notebookId);
          }}
          style={{ color: 'grey' }}
          icon={PlayIcon}
          disabled={kernelStatus !== 'idle'}
        />
        <IconButton
          variant="invisible"
          size="small"
          color="secondary"
          aria-label="Run all cells"
          title="Run all cells"
          onClick={e => {
            e.preventDefault();
            notebookStore.runAll(notebookId);
          }}
          style={{ color: 'grey' }}
          icon={PaperAirplaneIcon}
          disabled={kernelStatus !== 'idle'}
        />
        <IconButton
          variant="invisible"
          size="small"
          color="error"
          aria-label="Interrupt"
          onClick={e => {
            e.preventDefault();
            notebookStore.interrupt(notebookId);
          }}
          icon={StopIcon}
          disabled={kernelStatus !== 'busy'}
        />
        <IconButton
          variant="invisible"
          size="small"
          color="error"
          aria-label="Delete"
          title="Delete"
          onClick={e => {
            e.preventDefault();
            notebookStore.delete(notebookId);
          }}
          icon={TrashIcon}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '50%',
          paddingRight: '7vw',
          gap: '0.75vw',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <IconButton
          variant="invisible"
          size="small"
          color="primary"
          aria-label="Insert cell"
          title="Insert cell"
          onClick={e => {
            e.preventDefault();
            if (type === 'raw') {
              notebookStore.insertBelow({
                id: notebookId,
                cellType: 'raw',
              });
            } else if (type === 'code') {
              notebookStore.insertBelow({
                id: notebookId,
                cellType: 'code',
              });
            } else if (type === 'markdown') {
              notebookStore.insertBelow({
                id: notebookId,
                cellType: 'markdown',
              });
            }
          }}
          style={{ color: 'grey' }}
          icon={PlusIcon}
        />
        <ButtonGroup>
          <Button
            variant={type === 'code' ? 'primary' : 'invisible'}
            onClick={() => handleChangeCellType('code')}
            size="small"
          >
            Code
          </Button>
          <Button
            variant={type === 'markdown' ? 'primary' : 'invisible'}
            onClick={() => handleChangeCellType('markdown')}
            size="small"
          >
            Markdown
          </Button>
          <Button
            variant={type === 'raw' ? 'primary' : 'invisible'}
            onClick={() => handleChangeCellType('raw')}
            size="small"
          >
            Raw
          </Button>
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default NotebookToolbar;
