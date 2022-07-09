import { Editor, Transforms } from "slate";
import isHotkey from 'is-hotkey';
import { executeCell } from "./../plugins/jupyter/withJupyter"
import { toggleMark } from '../utils/MarkUtils';
import { getBlockType} from "../utils/EditorUtils";

const keyBindings = {
  onKeyDown: (editor: Editor, event: KeyboardEvent) => {
    const blockType = getBlockType(editor) as string;
    if ((blockType === 'jupyter-cell') && isHotkey("enter", event)) {
      event.preventDefault();
      Transforms.insertText(editor, "\n");
      return;
    }
    if ((blockType === 'jupyter-cell') && isHotkey("shift+enter", event)) {
      event.preventDefault();
      executeCell(editor);
      return;
    }
    if (isHotkey("shift+enter", event)) {
      event.preventDefault();
      Transforms.insertText(editor, "\n");
      return;
    }
    if (isHotkey('mod+b', event)) {
      toggleMark(editor, 'bold');
      return;
    }
    if (isHotkey('mod+i', event)) {
      toggleMark(editor, 'italic');
      return;
    }
    if (isHotkey('mod+k', event)) {
      toggleMark(editor, 'code');
      return;
    }
    if (isHotkey('mod+u', event)) {
      toggleMark(editor, 'underline');
      return;
    }
  },
};

export default keyBindings;
