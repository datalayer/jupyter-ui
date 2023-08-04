import {useState} from 'react';
import {useDispatch} from 'react-redux';
import {PanelLayout} from '@lumino/widgets';
import {Box} from '@primer/react';
import {notebookActions, selectActiveCell} from '../../NotebookState';
import {CellSidebarProps} from './lumino/CellSidebarWidget';
import {
  PlayIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XIcon,
} from '@primer/octicons-react';
import {IconButton} from '@primer/react';

import {DATALAYER_CELL_HEADER_CLASS} from './lumino/CellSidebarWidget';

export const CellSidebarNew = (props: CellSidebarProps) => {
  const { notebookId, cellId } = props;
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const activeCell = selectActiveCell(notebookId);
  const layout = activeCell?.layout;
  if (layout) {
    const cellWidget = (layout as PanelLayout).widgets[0];
    if (cellWidget?.node.id === cellId) {
      if (!visible) {
        setVisible(true);
      }
    }
    if (cellWidget?.node.id !== cellId) {
      if (visible) {
        setVisible(false);
      }
    }
  }
  if (!visible) {
    return <div></div>;
  }
  return activeCell ? (
    <Box
      className={DATALAYER_CELL_HEADER_CLASS}
      sx={{
        '& p': {
          marginBottom: '0 !important',
        },
      }}
    >
      <span style={{display: 'flex'}}>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Run Cell"
          onClick={e => {
            e.preventDefault();
            dispatch(notebookActions.run.started(notebookId));
          }}
          icon={PlayIcon}
          variant="invisible"
        />
      </span>
      <span style={{display: 'flex'}}>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add Code Above"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.insertAbove.started({
                uid: notebookId,
                cellType: 'code',
              })
            );
          }}
          icon={ChevronUpIcon}
          variant="invisible"
        />
      </span>
      <span style={{display: 'flex'}}>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Run Cell"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.insertAbove.started({
                uid: notebookId,
                cellType: 'markdown',
              })
            );
          }}
          icon={ChevronUpIcon}
          variant="invisible"
        />
      </span>
      <span style={{display: 'flex'}}>
        {/* activeCell.model.type === "code" ?
            <Button leadingVisual={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              dispatch(notebookActions.changeCellType.started("markdown"));
            }}>
              To Markdown
            </Button>
          :
            <Button leadingVisual={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              dispatch(notebookActions.changeCellType.started("code"));
            }}>
              To Code
            </Button>
        */}
      </span>
      <span style={{display: 'flex'}}>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Run Cell"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.insertBelow.started({
                uid: notebookId,
                cellType: 'markdown',
              })
            );
          }}
          icon={ChevronDownIcon}
          variant="invisible"
        />
      </span>
      <span style={{display: 'flex'}}>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Run Cell"
          onClick={e => {
            e.preventDefault();
            dispatch(
              notebookActions.insertBelow.started({
                uid: notebookId,
                cellType: 'code',
              })
            );
          }}
          icon={ChevronDownIcon}
          variant="invisible"
        />
      </span>
      <span style={{display: 'flex'}}>
        <IconButton
          size="small"
          color="error"
          aria-label="Delete"
          onClick={e => {
            e.preventDefault();
            dispatch(notebookActions.delete.started(notebookId));
          }}
          icon={XIcon}
          variant="invisible"
        />
      </span>
    </Box>
  )
  :
  (
    <></>
  )
}

export default CellSidebarNew;
