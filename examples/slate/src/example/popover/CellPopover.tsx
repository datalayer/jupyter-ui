/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useRef, useEffect, Ref } from "react";
import { Range, Editor as SlateEditor } from "slate";
import { ReactEditor } from "slate-react";
import { Kernel } from '@datalayer/jupyter-react';
import { styled } from '@mui/material/styles';
import { makeStyles } from "@mui/styles";
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { grey } from "@mui/material/colors";
import Paper from "@mui/material/Paper";
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import Add from '@mui/icons-material/Add';
import PlayListPlay from '@mui/icons-material/PlaylistPlay';
import CleaningServices from '@mui/icons-material/CleaningServices';
import { Portal } from "../../editor/components/Components";
import { getBlockType } from "../../editor/utils/EditorUtils";
import { insertCell, executeCell, clearOutput } from '../../editor/plugins/jupyter/withJupyter';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}));

const useStyles = makeStyles(() => ({
  paper: {
    backgroundColor: grey[200],
  }
}));

const CellPopover = (props: { slateEditor: SlateEditor, kernel: Kernel, selection: Range }) => {
  const { slateEditor, kernel, selection } = props;
  const classes = useStyles();
  const ref = useRef<HTMLDivElement | null>();
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (
      !selection ||
      !ReactEditor.isFocused(slateEditor) ||
      Range.isCollapsed(selection) ||
      SlateEditor.string(slateEditor, selection) === ""
    ) {
      el.removeAttribute("style");
      return;
    }
    const blockType = getBlockType(slateEditor) as string;
    if (blockType !== 'jupyter-cell') {
      return;
    }
    const domSelection = window.getSelection();
    const domRange = domSelection!.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    el.style.opacity = "1";
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
    el.style.left = `${rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2}px`;
  }, [slateEditor, selection]);
  return (
    <Portal>
      <Paper
        className={classes.paper}
        ref={ref as Ref<HTMLDivElement>}
        sx={{
          position: 'absolute',
          zIndex: 1,
          top: '-10000px',
          left: '-10000px',
          opacity: 0,
//          transition: 'opacity 0.15s',
        }}
      >
        <StyledToggleButtonGroup
          size="small"
          color="info"
//          value={formats}
//          onChange={handleFormat}
          aria-label="code"
        >
          <ToggleButton
            value="execute"
            aria-label="execute"
            size="small"
            onMouseDown={(event: any) => {
              event.preventDefault();
              executeCell(slateEditor);
            }}
          >
            <PlayArrowOutlined
              fontSize="small"
            />
          </ToggleButton>
          <ToggleButton
            value="execute-all"
            aria-label="execute-all"
            size="small"
            disabled={true}
          >
            <PlayListPlay
              fontSize="small"
            />
          </ToggleButton>
          <ToggleButton
            aria-label="clean"
            value="clean"
            size="small"
            onMouseDown={(event: any) => {
              event.preventDefault();
              clearOutput(slateEditor);
            }}
          >
            <CleaningServices
              fontSize="small"
            />
          </ToggleButton>
          <ToggleButton
            value="add"
            aria-label="add"
            size="small"
            onMouseDown={(event: any) => {
              event.preventDefault();
              insertCell(slateEditor, kernel);
            }}
          >
            <Add
              fontSize="small"
            />
          </ToggleButton>
        </StyledToggleButtonGroup>
      </Paper>
    </Portal>
  );
}

export default CellPopover;
