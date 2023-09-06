import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PanelLayout } from '@lumino/widgets';
import { Box, IconButton } from '@primer/react';
import { PlayIcon, ChevronUpIcon, ChevronDownIcon, SquareIcon, XIcon } from '@primer/octicons-react';
import { notebookActions, selectActiveCell } from '../../NotebookState';
import { CellSidebarProps } from './CellSidebarWidget';

import { DATALAYER_CELL_HEADER_CLASS } from './CellSidebarWidget';

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
          aria-label="Run cell"
          title="Run cell"
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
          aria-label="Add code cell above"
          title="Add code cell above"
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
          aria-label="Add markdown cell above"
          title="Add markdown cell above"
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
       { activeCell.model.type === "code" ?
            <IconButton
              aria-label="Convert to markdow cell"
              title="Convert to markdow cell" 
              icon={SquareIcon}
              size="small"
              variant="invisible"
              onClick={e => {
                e.preventDefault();
                dispatch(notebookActions.changeCellType.started({ uid: notebookId, cellType: "markdown" }));
              }
            }/>
          :
            <IconButton
              aria-label="Convert to code cell"
              title="Convert to code cell" 
              icon={SquareIcon}
              variant="invisible"
              size="small"
              onClick={(e: any) => {
                e.preventDefault();
                dispatch(notebookActions.changeCellType.started({ uid: notebookId, cellType: "code" }));
              }}
            />
          }
      </span>
      <span style={{display: 'flex'}}>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add markdown cell below"
          title="Add markdown cell below"
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
          aria-label="Add code cell above"
          title="Add code cell above"
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
          aria-label="Delete cell"
          title="Delete cell"
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
