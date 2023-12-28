/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, ButtonGroup, IconButton } from '@primer/react';
import {
  PlusIcon,
  ChevronRightIcon,
  StopIcon,
  ZapIcon,
  TrashIcon,
  SyncIcon,
} from '@primer/octicons-react';
import { FastForwardIcon } from '@datalayer/icons-react';
import { IJupyterReactState } from '../../state/redux/State';
import { cmdIds } from '../../components/notebook/NotebookCommands';
import {
  notebookActions,
  selectNotebook,
  selectSaveRequest,
} from '../../components/notebook/NotebookRedux';

export const NotebookToolbarAutoSave = (props: { notebookId: string }) => {
  const { notebookId } = props;
  const [autoSave, setAutoSave] = useState(false);
  const [addType, setAddType] = useState('code');
  const dispatch = useDispatch();
  const notebook = selectNotebook(notebookId);
  const saveRequest = selectSaveRequest(notebookId);
  const notebookstate = useSelector((state: IJupyterReactState) => {
    return state.notebook;
  });
  useEffect(() => {
    notebook?.adapter?.commands.execute(cmdIds.save);
  }, [saveRequest]);
  useEffect(() => {
    if (autoSave) {
      notebook?.adapter?.commands.execute(cmdIds.save);
    }
  }, [notebookstate]);
  const handleChangeCellType = (newType: string) => {
    setAddType(newType);
  };
  return (
    <Box
      display="flex"
      pt={1}
      pb={1}
      style={{ width: '100%', position: 'relative', top: '0' }}
    >
      <Box
        flexGrow={1}
        style={{ width: '50%', paddingLeft: '7vw', gap: '0.75vw' }}
      >
        <IconButton
          variant="invisible"
          size="small"
          color="primary"
          aria-label="Save"
          title="Save"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.save.started({
                uid: notebookId,
                date: new Date(),
              })
            );
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
            dispatch(notebookActions.run.started(notebookId));
          }}
          icon={ChevronRightIcon}
        />
        {notebook?.kernelStatus === 'idle' ? (
          <IconButton
            variant="invisible"
            size="small"
            color="secondary"
            aria-label="Run all cells"
            title="Run all cells"
            onClick={e => {
              e.preventDefault();
              dispatch(notebookActions.runAll.started(notebookId));
            }}
            icon={FastForwardIcon}
          />
        ) : (
          <IconButton
            variant="invisible"
            size="small"
            color="error"
            aria-label="Interrupt"
            onClick={e => {
              e.preventDefault();
              dispatch(notebookActions.interrupt.started(notebookId));
            }}
            icon={StopIcon}
          />
        )}
        <IconButton
          variant="invisible"
          size="small"
          color="error"
          aria-label="Delete"
          title="Delete"
          onClick={e => {
            e.preventDefault();
            dispatch(notebookActions.delete.started(notebookId));
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
          aria-label="Autosave"
          title="Autosave"
          variant={autoSave ? 'primary' : 'invisible'}
          onClick={e => {
            e.preventDefault();
            setAutoSave(!autoSave);
          }}
          size="small"
          color={autoSave ? 'success' : 'error'}
          icon={SyncIcon}
        />
        <IconButton
          variant="invisible"
          size="small"
          color="primary"
          aria-label="Insert cell"
          title="Insert cell"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.insertBelow.started({
                uid: notebookId,
                cellType: addType,
              })
            );
          }}
          icon={PlusIcon}
        />
        <ButtonGroup>
          <Button
            variant={addType == 'code' ? 'primary' : 'invisible'}
            onClick={() => handleChangeCellType('code')}
            size="small"
          >
            Code
          </Button>
          <Button
            variant={addType == 'markdown' ? 'primary' : 'default'}
            onClick={() => handleChangeCellType('markdown')}
            size="small"
          >
            Markdown
          </Button>
          <Button
            variant={addType == 'raw' ? 'primary' : 'invisible'}
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

export default NotebookToolbarAutoSave;
