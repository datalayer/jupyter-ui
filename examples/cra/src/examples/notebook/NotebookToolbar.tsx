import {useState} from 'react';
import {useDispatch} from 'react-redux';
import {Button, FormControl, ToggleSwitch} from '@primer/react';
import {Box, Text} from '@primer/react';
import {PlusIcon, PlayIcon, FileIcon, StopIcon, CommentDiscussionIcon} from '@primer/octicons-react';
import {
  Terminal,
  notebookActions,
  selectNotebook,
} from '@datalayer/jupyter-react';

const terminal = <Terminal />;

const NotebookToolbar = (props: {notebookId: string}) => {
  const {notebookId} = props;
  const [state, setState] = useState({
    terminal: false,
  });
  const dispatch = useDispatch();
  const notebook = selectNotebook(notebookId);
  const onClick = () => {
    setState({...state, terminal: !state.terminal});
  };
  return (
    <>
      {/* <Grid container spacing={3} style={{padding: '30px 110px 0px 30px'}}> */}
      <Box
        sx={{
          display: 'flex',
          padding: '30px 110px 0px 30px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{flex: 1}}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <Button
              variant="default"
              color="primary"
              leadingIcon={PlusIcon}
              onClick={e => {
                e.preventDefault();
                dispatch(
                  notebookActions.insertBelow.started({
                    uid: notebookId,
                    cellType: 'raw',
                  })
                );
              }}
            >
              Raw
            </Button>
            <Button
              variant="default"
              color="primary"
              leadingIcon={PlusIcon}
              onClick={e => {
                e.preventDefault();
                dispatch(
                  notebookActions.insertBelow.started({
                    uid: notebookId,
                    cellType: 'markdown',
                  })
                );
              }}
            >
              Markdown
            </Button>
            <Button
              variant="default"
              color="primary"
              leadingIcon={PlusIcon}
              onClick={e => {
                e.preventDefault();
                dispatch(
                  notebookActions.insertBelow.started({
                    uid: notebookId,
                    cellType: 'code',
                  })
                );
              }}
            >
              Code
            </Button>
            <FormControl
              sx={{
                paddingLeft: 5,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FormControl.Label>
                <Text as="p" sx={{display: 'block'}}>
                  Terminal
                </Text>
              </FormControl.Label>
              <ToggleSwitch
                aria-labelledby="switchLabel"
                onClick={onClick}
                checked={state.terminal}
              />
            </FormControl>
          </Box>
        </Box>
        <Box sx={{flex: 1, textAlign: 'center'}}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <Button
              variant="outline"
              color="primary"
              leadingIcon={FileIcon}
              onClick={() =>
                dispatch(
                  notebookActions.save.started({
                    uid: notebookId,
                    date: new Date(),
                  })
                )
              }
            >
              Save
            </Button>
            {notebook?.kernelStatus === 'idle' && (
              <Button
                variant="outline"
                color="primary"
                leadingIcon={PlayIcon}
                onClick={e => {
                  e.preventDefault();
                  dispatch(notebookActions.runAll.started(notebookId));
                }}
              >
                Run all
              </Button>
            )}
            {notebook?.kernelStatus === 'busy' && (
              <Button
                variant="outline"
                color="secondary"
                leadingIcon={StopIcon}
                onClick={e => {
                  e.preventDefault();
                  dispatch(notebookActions.interrupt.started(notebookId));
                }}
              >
                Stop
              </Button>
            )}
            {notebook?.kernelStatus !== 'idle' &&
              notebook?.kernelStatus !== 'busy' && (
                <Button
                  variant="outline"
                  color="primary"
                  leadingIcon={CommentDiscussionIcon}
                >
                  {/* //Doubt */}
                </Button>
              )}
          </Box>
        </Box>
      </Box>
      {state.terminal && terminal}
    </>
  );
};

export default NotebookToolbar;
