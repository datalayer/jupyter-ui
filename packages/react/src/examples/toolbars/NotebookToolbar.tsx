import {useState, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
  PlusIcon,
  PlayIcon,
  StopIcon,
  FileAddedIcon,
  TrashIcon,
  SyncIcon,
} from '@primer/octicons-react';
import {Button, ButtonGroup, IconButton} from '@primer/react';
import {cmdIds} from '../../components/notebook/NotebookCommands';
import {IJupyterReactState} from '../../state/State';
import {
  notebookActions,
  selectNotebook,
  selectSaveRequest,
} from '../../components/notebook/NotebookState';

const NotebookToolbar = (props: {notebookId: string}) => {
  const {notebookId} = props;
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
    <div
      style={{
        display: 'flex',
        width: '100%',
        borderBottom: '0.1rem solid lightgrey',
        position: 'relative',
        zIndex: '1',
        backgroundColor: 'white',
        top: '0',
        padding: '0.25rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '50%',
          paddingLeft: '7vw',
          gap: '0.75vw',
          alignItems: 'center',
        }}
      >
        <IconButton
          variant="invisible"
          size="small"
          color="primary"
          aria-label="Save"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.save.started({uid: notebookId, date: new Date()})
            );
          }}
          style={{color: 'grey'}}
          icon={FileAddedIcon}
        />
        <IconButton
          variant="invisible"
          size="small"
          color="primary"
          aria-label="Insert Cell"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.insertBelow.started({
                uid: notebookId,
                cellType: addType,
              })
            );
          }}
          style={{color: 'grey'}}
          icon={PlusIcon}
        />
        <IconButton
          variant="invisible"
          size="small"
          color="secondary"
          aria-label="Run Cell"
          onClick={e => {
            e.preventDefault();
            dispatch(notebookActions.run.started(notebookId));
          }}
          style={{color: 'grey'}}
          icon={PlayIcon}
        />
        {notebook?.kernelStatus === 'idle' && (
          <IconButton
            variant="invisible"
            size="small"
            color="secondary"
            aria-label="Run All Cells"
            onClick={e => {
              e.preventDefault();
              dispatch(notebookActions.runAll.started(notebookId));
            }}
            style={{color: 'grey'}}
            icon={PlayIcon}
          />
        )}
        {notebook?.kernelStatus === 'busy' && (
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
          onClick={e => {
            e.preventDefault();
            dispatch(notebookActions.delete.started(notebookId));
          }}
          icon={TrashIcon}
        />
      </div>
      <div
        style={{
          display: 'flex',
          width: '50%',
          paddingRight: '7vw',
          gap: '0.75vw',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <IconButton
          aria-label="Auto Save"
          variant={autoSave ? 'primary' : 'outline'}
          onClick={e => {
            e.preventDefault();
            setAutoSave(!autoSave);
          }}
          size="small"
          color={autoSave ? 'success' : 'error'}
          icon={SyncIcon}
        />

        <ButtonGroup>
          <Button
            variant={addType == 'code' ? 'primary' : 'outline'}
            onClick={() => handleChangeCellType('code')}
            size="small"
          >
            Code
          </Button>
          <Button
            variant={addType == 'markdown' ? 'primary' : 'outline'}
            onClick={() => handleChangeCellType('markdown')}
            size="small"
          >
            Markdown
          </Button>
          <Button
            variant={addType == 'raw' ? 'primary' : 'outline'}
            onClick={() => handleChangeCellType('raw')}
            size="small"
          >
            Raw
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
};

export default NotebookToolbar;
