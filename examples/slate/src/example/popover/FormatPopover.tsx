import { useState, useRef, useEffect, Ref } from "react";
import { Range, Editor } from "slate";
import { ReactEditor } from "slate-react";
import { makeStyles } from "@mui/styles";
import { grey } from "@mui/material/colors";
import Paper from "@mui/material/Paper";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import { Portal } from "./../../editor/components/Components";
import MarkButton from "./../../editor/buttons/MarkButton";
import ButtonGroup from "./../../editor/buttons/ButtonGroup";
import { getBlockType } from "./../../editor/utils/EditorUtils";

const useStyles = makeStyles(() => ({
  paper: {
    backgroundColor: grey[200],
  }
}));

const FormatPopover = (props: { editor: Editor, selection: Range }) => {
  const { editor, selection } = props;
  const [formats, setFormats] = useState(() => []);
  const classes = useStyles();
  const ref = useRef<HTMLDivElement | null>();
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (
      !selection ||
      !ReactEditor.isFocused(editor) ||
      Range.isCollapsed(selection) ||
      Editor.string(editor, selection) === ""
    ) {
      el.removeAttribute("style");
      return;
    }
    const blockType = getBlockType(editor) as string;
    if (blockType === 'jupyter-cell') {
      return;
    }
    const domSelection = window.getSelection();
    const domRange = domSelection!.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    el.style.opacity = "1";
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
    el.style.left = `${rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2}px`;
  }, [editor, selection]);
  const handleFormats = (_: any, formats: any) => {
    setFormats(formats);
  };
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
        <ButtonGroup
          value={formats}
          size="small"
          aria-label="text format"
          onChange={handleFormats}
        >
          <MarkButton format="bold" label="bold">
            <FormatBoldIcon fontSize="small" />
          </MarkButton>
          <MarkButton format="italic" label="italic">
            <FormatItalicIcon fontSize="small" />
          </MarkButton>
          <MarkButton format="underline" label="underlne">
            <FormatUnderlinedIcon fontSize="small" />
          </MarkButton>
        </ButtonGroup>
      </Paper>
    </Portal>
  );
}

export default FormatPopover;
