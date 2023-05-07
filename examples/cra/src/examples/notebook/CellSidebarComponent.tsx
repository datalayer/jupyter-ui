import {useState} from 'react';
import {useDispatch} from 'react-redux';
import {
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@primer/octicons-react';
import {XIcon} from '@primer/octicons-react';
import {Text} from '@primer/react';
import {PanelLayout} from '@lumino/widgets';
import {
  selectNotebook,
  notebookActions,
  CellSidebarProps,
} from '@datalayer/jupyter-react';

const CELL_HEADER_DIV_CLASS = 'dla-CellHeader-container';

const CellSidebarComponent = (props: CellSidebarProps) => {
  const {notebookId} = props;
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const notebook = selectNotebook(notebookId);
  const layout = notebook?.activeCell?.layout;
  if (layout) {
    const selectedCellSidebar = (notebook?.activeCell?.layout as PanelLayout)
      .widgets[0];
    if (!visible && selectedCellSidebar.id === props.cellId) {
      setVisible(true);
    }
    if (visible && selectedCellSidebar.id !== props.cellId) {
      setVisible(false);
    }
  }
  if (!visible) {
    return <div></div>;
  }
  return (
    <div className={CELL_HEADER_DIV_CLASS}>
      <div
        onClick={e => {
          e.preventDefault();
          dispatch(notebookActions.run.started(notebookId));
        }}
      >
        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
          <ChevronRightIcon size={16} />
          <Text as="p" color="textSecondary">
            Run
          </Text>
        </span>
      </div>
      <div
        onClick={e => {
          e.preventDefault();
          dispatch(
            notebookActions.insertAbove.started({
              uid: notebookId,
              cellType: 'code',
            })
          );
        }}
      >
        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
          <ChevronUpIcon size={16} />

          <Text as="p" color="textSecondary">
            Add above
          </Text>
        </span>
      </div>
      <div
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
        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
          <ChevronDownIcon size={16} />
          <Text as="p" color="textSecondary">
            Add below
          </Text>
        </span>
      </div>
      <div
        onClick={e => {
          e.preventDefault();
          dispatch(notebookActions.delete.started(notebookId));
        }}
      >
        <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
          <XIcon size={16} />
          <Text as="p" color="textSecondary">
            Delete
          </Text>
        </span>
      </div>
    </div>
  );
};

export default CellSidebarComponent;
