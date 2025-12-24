/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Text, ToggleSwitch } from '@primer/react';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme';
import { CellSidebarExtension } from '../components';
import { Notebook2 } from '../components/notebook/Notebook2';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { useJupyterReactStore } from '../state';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookColormode = () => {
  const { serviceManager } = useJupyter();
  const { colormode, setColormode } = useJupyterReactStore();
  const [isOn, setIsOn] = useState(false);
  const extensions = useMemo(() => [new CellSidebarExtension()], [colormode]);
  useEffect(() => {
    if (isOn) {
      setColormode('dark');
    } else {
      setColormode('light');
    }
  }, [isOn]);
  const onClick = useCallback(() => {
    setIsOn(!isOn);
  }, [isOn]);
  const handleSwitchChange = useCallback((on: boolean) => {
    setIsOn(on);
  }, []);
  return (
    <>
      <JupyterReactTheme>
        <Text
          fontSize={2}
          fontWeight="bold"
          id="switch-label"
          display="block"
          mb={1}
        >
          {colormode === 'light' ? 'Light' : 'Dark'} Mode
        </Text>
        <ToggleSwitch
          size="small"
          onClick={onClick}
          onChange={handleSwitchChange}
          checked={isOn}
          statusLabelPosition="end"
          aria-labelledby="switch-label"
        />
        {serviceManager && (
          <Notebook2
            nbformat={NBFORMAT as INotebookContent}
            serviceManager={serviceManager}
            startDefaultKernel
            id="notebook-model-id"
            height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
            extensions={extensions}
            Toolbar={NotebookToolbar}
          />
        )}
      </JupyterReactTheme>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookColormode />);
