/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { INotebookContent } from '@jupyterlab/nbformat';
import { Text, ToggleSwitch, theme as primerTheme } from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { jupyterLabTheme, JupyterReactTheme } from '../theme';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookTheme = () => {
  const [theme, setTheme] = useState<Theme>(jupyterLabTheme);
  const [isOn, setIsOn] = useState(false);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  const onClick = useCallback(() => {
    setIsOn(!isOn);
  }, [isOn]);
  useEffect(() => {
    if (isOn) {
      setTheme(primerTheme);
    } else {
      setTheme(jupyterLabTheme);
    }
  }, [isOn]);
  const handleSwitchChange = useCallback((on: boolean) => {
    setIsOn(on);
  }, []);
  return (
    <>
      <JupyterReactTheme theme={theme}>
        <Text
          fontSize={2}
          fontWeight="bold"
          id="switch-label"
          display="block"
          mb={1}
        >
          Primer Theme
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
          id="notebook-model-id"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
          Toolbar={NotebookToolbar}
          startDefaultKernel
        />
      </JupyterReactTheme>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookTheme />);
