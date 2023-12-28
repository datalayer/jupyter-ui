/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Editor } from "slate";
import keyBindings from "../keys/KeyBindings";

const useEditorConfig = (editor: Editor) => {
  return { keyBindings }
}

export default useEditorConfig;
