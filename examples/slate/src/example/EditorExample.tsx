import { useMemo, useState, useCallback } from 'react';
import { createEditor, Range } from 'slate';
import { Slate, withReact } from 'slate-react';
import { withHistory } from "slate-history";
import { Kernel, useJupyter } from '@datalayer/jupyter-react';
import pipe from "lodash/fp/pipe";
import initialValue from './initialValue';
import LayoutExample from './LayoutExample';
import withImages from './../editor/plugins/images/withImages';
import withJupyter from './../editor/plugins/jupyter/withJupyter';
import useSelection from "./../editor/hooks/useSelection";
import FormatPopover from './popover/FormatPopover';
import CellPopover from './popover/CellPopover';

const getKernel = (baseUrl: string, wsUrl: string): Kernel => {
  const kernel = new Kernel({ baseUrl, wsUrl });
  return kernel;
}

const withPlugins = pipe(
  withHistory,
  withReact,
  withImages,
  withJupyter,
);

const EditorExample = () => {
  const slateEditor = useMemo(() => withPlugins(createEditor()), []);
  const { baseUrl, wsUrl } = useJupyter();
  const kernel = useMemo(() => getKernel(baseUrl, wsUrl), []);
  const [value, setValue] = useState(initialValue(kernel));
  const [previousSelection, selection, setSelection] = useSelection(slateEditor);
  const onChange = useCallback(
    (value: any) => {
      (setSelection as ((selection: any) => void))(slateEditor.selection);
      setValue(value);
    },
    [setSelection, slateEditor]
  );
  return (
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
