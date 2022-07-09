import { Editor } from "slate";
import keyBindings from "../keys/KeyBindings";

const useEditorConfig = (editor: Editor) => {
  return { keyBindings }
}

export default useEditorConfig;
