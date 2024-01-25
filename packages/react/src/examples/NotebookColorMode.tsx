/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, ToggleSwitch } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { ColorMode } from '../jupyter/lab/JupyterLabColorMode';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookColorMode = () => {
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [isOn, setIsOn] = useState(false);
  useEffect(() => {
    if (isOn) {
      setColorMode('dark');
    } else {
      setColorMode('light');
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
      <Jupyter colorMode={colorMode}>
        <Text
          fontSize={2}
          fontWeight="bold"
          id="switch-label"
          display="block"
          mb={1}
        >
          { colorMode === 'light' ? 'Light' : 'Dark' } Mode
        </Text>
        <ToggleSwitch
          size="small"
          onClick={onClick}
          onChange={handleSwitchChange}
          checked={isOn}
          statusLabelPosition="end"
          aria-labelledby="switch-label"
        />
        <Notebook
          nbformat={nbformat as INotebookContent}
          uid="notebook-model-uid"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          cellSidebarMargin={120}
          CellSidebar={CellSidebar}
          Toolbar={NotebookToolbar}
        />
      </Jupyter>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookColorMode />);
