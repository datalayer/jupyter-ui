import {useDispatch} from 'react-redux';
import {Button} from '@primer/react';
import {PlayIcon} from '@primer/octicons-react';
import {FileIcon} from '@primer/octicons-react';
import {Text} from '@primer/react';
import {notebookActions} from '@datalayer/jupyter-react';

const NotebookSimpleToolbar = (props: {notebookId: string}) => {
  const {notebookId} = props;
  const dispatch = useDispatch();
  return (
    <>
      <Text as="h3">Notebook Example</Text>
      <>
        <Button
          variant="outline"
          color="secondary"
          leadingIcon={PlayIcon}
          onClick={() => dispatch(notebookActions.run.started(notebookId))}
        >
          Run
        </Button>
      </>
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
    </>
  );
};

export default NotebookSimpleToolbar;
