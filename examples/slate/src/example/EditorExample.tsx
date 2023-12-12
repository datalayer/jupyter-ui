/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { createEditor, Range, Descendant } from 'slate';
import { Slate, withReact } from 'slate-react';
import { withHistory } from "slate-history";
import { Kernel, useJupyter } from '@datalayer/jupyter-react';
import { ServerConnection } from '@jupyterlab/services';
import pipe from "lodash/fp/pipe";
import initialValue from './initialValue';
import LayoutExample from './LayoutExample';
import withImages from './../editor/plugins/images/withImages';
import withJupyter from './../editor/plugins/jupyter/withJupyter';
import useSelection from "./../editor/hooks/useSelection";
import FormatPopover from './popover/FormatPopover';
import CellPopover from './popover/CellPopover';
import { KernelManager } from '@jupyterlab/services';

const getKernel = (kernelManager: KernelManager | undefined, serverSettings: ServerConnection.ISettings): Kernel | undefined => {
  if (kernelManager) {
    const kernel = new Kernel({
      kernelManager,
      kernelName: 'python',
      kernelSpecName: 'python',
      kernelType: 'notebook',
      serverSettings,
    });
    return kernel;  
  }
}

const withPlugins = pipe(
  withHistory,
  withReact,
  withImages,
  withJupyter,
);

const EditorExample = () => {
  const slateEditor = useMemo(() => withPlugins(createEditor()), []);
  const { kernelManager, serverSettings } = useJupyter();
  const kernel = useMemo(() => getKernel(kernelManager, serverSettings), [kernelManager]);
  const [value, setValue] = useState<Descendant[]>();
  const [previousSelection, selection, setSelection] = useSelection(slateEditor);
  useEffect(() => {
    if (kernelManager) {
      const kernel = getKernel(kernelManager, serverSettings);
      setValue(initialValue(kernel!));
    }
  }, [kernelManager]);
  const onChange = useCallback(
    (value: any) => {
      (setSelection as ((selection: any) => void))(slateEditor.selection);
      setValue(value);
    },
    [setSelection, slateEditor]
  );
  return (
    (!value || !kernel)
      ? 
        <></>
      :
        <Slate
          editor={slateEditor}
          value={value}
          onChange={onChange}
        >
          <FormatPopover 
            editor={slateEditor}
            selection={selection as Range}
          />
          <CellPopover 
            slateEditor={slateEditor}
            kernel={kernel}
            selection={selection as Range}
          />
          <LayoutExample
            slateEditor={slateEditor}
            kernel={kernel}
            previousSelection={previousSelection as Range}
            selection={selection as Range}
          />
        </Slate>
    );
}

export default EditorExample;
