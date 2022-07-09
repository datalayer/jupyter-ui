import { Editor } from "slate";

export const getActiveMarks = (editor: Editor) => {
  return new Set(Object.keys(Editor.marks(editor) ?? {}));
}

export const toggleMark = (editor: Editor, mark: string) => {
  const activeMarks = getActiveMarks(editor);
  if (activeMarks.has(mark)) {
    Editor.removeMark(editor, mark);
  } else {
    Editor.addMark(editor, mark, true);
  }
}
