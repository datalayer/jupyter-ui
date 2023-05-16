import { useDispatch } from 'react-redux';
import { Button, Text } from '@primer/react';
import { Toolbar } from '@datalayer/primer-addons';
import { PlayIcon, FileIcon } from '@primer/octicons-react';
import { notebookActions } from '@datalayer/jupyter-react';

const NotebookSimpleToolbar = (props: {notebookId: string}) => {
  const { notebookId } = props;
  const dispatch = useDispatch();
  return (
    <Toolbar>
      <Button
        variant="outline"
        color="secondary"
        leadingIcon={PlayIcon}
        onClick={() => dispatch(notebookActions.run.started(notebookId))}
      >
        Run
      </Button>
      <Button
        variant="outline"
        // color="secondary"
        leadingIcon={FileIcon}
        onClick={() =>
          dispatch(
            notebookActions.save.started({uid: notebookId, date: new Date()})
          )
        }
      >
        Save
      </Button>
      <Text as="h3">
        {/* Notebook: {notebook.notebookChange.cellsChange} */}
      </Text>
    </Toolbar>
  );
};

export default NotebookSimpleToolbar;
