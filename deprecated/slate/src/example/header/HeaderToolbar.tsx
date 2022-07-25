import { useState } from 'react';
import { alpha, styled } from '@mui/material/styles';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import PlayListPlay from '@mui/icons-material/PlayListPlay';
import CleaningServices from '@mui/icons-material/CleaningServices';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import FormatAlignLeft from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenter from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRight from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustify from '@mui/icons-material/FormatAlignJustify';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import FormatListNumbered from '@mui/icons-material/FormatListNumbered';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { deleteCurrentBlock } from './../../editor/utils/EditorUtils';
import { getActiveMarks, toggleMark } from './../../editor/utils/MarkUtils';
import { insertCell, executeCell, clearOutput } from './../../editor/plugins/jupyter/withJupyter';

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

const HeaderToolbar = ({ kernel, blockType, editor }: any) => {
//  const [alignment, setAlignment] = useState('left');
  const [formats, setFormats] = useState(() => ['italic']);
  const handleFormat = (
    event: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    setFormats(newFormats);
  };
/*
  const handleAlignment = (event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
    setAlignment(newAlignment);
  };
*/
  return (
    <div>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          backgroundColor: (theme) => alpha(theme.palette.common.white, 0.5),
          border: (theme) => `1px solid ${theme.palette.divider}`,
          flexWrap: 'wrap',
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
            disabled={blockType !== "jupyter-cell"}
            onMouseDown={(event: any) => {
              event.preventDefault();
              executeCell(editor);
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
            disabled={blockType !== "jupyter-cell"}
            onMouseDown={(event: any) => {
              event.preventDefault();
              clearOutput(editor);
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
            disabled={blockType === null || blockType === ""}
            onMouseDown={(event: any) => {
              event.preventDefault();
              insertCell(editor, kernel);
            }}
          >
            <Add
              fontSize="small"
            />
          </ToggleButton>
        </StyledToggleButtonGroup>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <StyledToggleButtonGroup
          size="small"
          value={formats}
          onChange={handleFormat}
          aria-label="text formatting"
        >
          <ToggleButton 
            value="bold"
            aria-label="bold"
            disabled={blockType === null || blockType === ""}
            selected={getActiveMarks(editor).has("bold")}
            onMouseDown={(event: any) => {
              event.preventDefault();
              toggleMark(editor, "bold");
            }}
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="italic"
            aria-label="italic"
            disabled={blockType === null || blockType === ""}
            selected={getActiveMarks(editor).has("italic")}
            onMouseDown={(event: any) => {
              event.preventDefault();
              toggleMark(editor, "italic");
            }}
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="underline"
            aria-label="underline"
            disabled={blockType === null || blockType === ""}
            selected={getActiveMarks(editor).has("underline")}
            onMouseDown={(event: any) => {
              event.preventDefault();
              toggleMark(editor, "underline");
            }}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="color" aria-label="color" disabled>
            <FormatColorFillIcon fontSize="small" />
            <ArrowDropDownIcon />
          </ToggleButton>
        </StyledToggleButtonGroup>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <StyledToggleButtonGroup
          size="small"
          aria-label="text alignment"
          exclusive
//          value={alignment}
//          onChange={handleAlignment}
        >
          <ToggleButton value="list-bullet" aria-label="list bullet" disabled>
            <FormatListBulleted fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list-numbered" aria-label="list numbered" disabled>
            <FormatListNumbered fontSize="small" />
          </ToggleButton>
        </StyledToggleButtonGroup>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <StyledToggleButtonGroup
          size="small"
          aria-label="text alignment"
          exclusive
//          value={alignment}
//          onChange={handleAlignment}
        >
          <ToggleButton value="left" aria-label="left aligned" disabled>
            <FormatAlignLeft fontSize="small" />
          </ToggleButton>
          <ToggleButton value="center" aria-label="centered" disabled>
            <FormatAlignCenter fontSize="small" />
          </ToggleButton>
          <ToggleButton value="right" aria-label="right aligned" disabled>
            <FormatAlignRight fontSize="small" />
          </ToggleButton>
          <ToggleButton value="justify" aria-label="justified" disabled>
            <FormatAlignJustify fontSize="small" />
          </ToggleButton>
        </StyledToggleButtonGroup>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <StyledToggleButtonGroup
          size="small"
          aria-label="text alignment"
          exclusive
//          value={alignment}
//          onChange={handleAlignment}
        >
          <ToggleButton
            aria-label="delete"
            value="delete"
            size="small"
            disabled={blockType === null || blockType === ""}
            onMouseDown={(event: any) => {
              event.preventDefault();
              deleteCurrentBlock(editor);
            }}
          >
            <Delete
              fontSize="small"
            />
          </ToggleButton>
        </StyledToggleButtonGroup>
      </Paper>
    </div>
  );
}

export default HeaderToolbar;
