/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { createEditor, Range, Descendant } from 'slate';
import { Slate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { Kernel, useJupyter } from '@datalayer/jupyter-react';
import { Kernel as JupyterKernel, ServiceManager } from '@jupyterlab/services';
import pipe from 'lodash/fp/pipe';
import initialValue from './initialValue';
import LayoutExample from './LayoutExample';
import withImages from './../editor/plugins/images/withImages';
import withJupyter from './../editor/plugins/jupyter/withJupyter';
import useSelection from './../editor/hooks/useSelection';
import FormatPopover from './popover/FormatPopover';
import CellPopover from './popover/CellPopover';

const getKernel = (
  kernelManager?: JupyterKernel.IManager,
  serviceManager?: ServiceManager.IManager
): Kernel | undefined => {
  if (serviceManager && kernelManager) {
    const kernel = new Kernel({
      kernelManager,
      kernelName: 'python',
      kernelSpecName: 'python',
      kernelType: 'notebook',
      kernelspecsManager: serviceManager.kernelspecs,
      sessionManager: serviceManager.sessions,
    });
    return kernel;
  }
};

const withPlugins = pipe(withHistory, withReact, withImages, withJupyter);

const EditorExample = () => {
  const slateEditor = useMemo(() => withPlugins(createEditor()), []);
  const { kernelManager, serviceManager } = useJupyter();
  const kernel = useMemo(
    () => getKernel(kernelManager, serviceManager),
    [kernelManager, serviceManager]
  );
  const [value, setValue] = useState<Descendant[]>();
  const [previousSelection, selection, setSelection] =
    useSelection(slateEditor);
  useEffect(() => {
    if (kernelManager) {
      const kernel = getKernel(kernelManager, serviceManager);
      setValue(initialValue(kernel!));
    }
  }, [kernelManager, serviceManager]);
  const onChange = useCallback(
    (value: any) => {
      (setSelection as (selection: any) => void)(slateEditor.selection);
      setValue(value);
    },
    [setSelection, slateEditor]
  );
  return !value || !kernel ? (
    <></>
  ) : (
    <Slate editor={slateEditor} value={value} onChange={onChange}>
      <FormatPopover editor={slateEditor} selection={selection as Range} />
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
};

export default EditorExample;
