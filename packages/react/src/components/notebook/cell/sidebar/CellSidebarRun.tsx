import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Button } from '@primer/react';
import { PlayIcon } from "@primer/octicons-react";
import { PanelLayout } from '@lumino/widgets';
import { notebookActions, selectActiveCell } from '../../NotebookState';
import { CellSidebarProps } from './base/CellSidebarWidget';

import { DATALAYER_CELL_HEADER_CLASS } from './base/CellSidebarWidget';

export const CellSidebarRun = (props: CellSidebarProps) => {
  const { notebookId } = props;
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const activeCell = selectActiveCell(notebookId);
  const layout = (activeCell?.layout);
  if (layout) {
    const cellWidget = (layout as PanelLayout).widgets[0];
    if (!visible && (cellWidget?.node.id === props.cellId)) {
      setVisible(true);
    }
    if (visible && (cellWidget?.node.id !== props.cellId)) {
      setVisible(false);
    }
  }
  if (!visible) {
    return <div></div>
  }
  return (
    activeCell ? 
      <Box
        className={DATALAYER_CELL_HEADER_CLASS}
        sx={{
          '& p': {
            marginBottom: '0 !important',
          }
        }}
      >
          <span style={{ display: "flex" }}>
            <Button trailingIcon={PlayIcon} size="small" variant="invisible" onClick={(e: any) => {
              e.preventDefault();
              dispatch(notebookActions.run.started(notebookId));
            }}>
              Run
            </Button>
          </span>
      </Box>
    :
      <></>
  );
}

export default CellSidebarRun;
