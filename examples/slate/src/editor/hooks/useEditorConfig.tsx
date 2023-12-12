/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { Editor } from "slate";
import keyBindings from "../keys/KeyBindings";

const useEditorConfig = (editor: Editor) => {
  return { keyBindings }
}

export default useEditorConfig;
