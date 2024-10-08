/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, ToggleSwitch, theme as primerTheme, Box } from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Colormode } from '../theme/JupyterLabColormode';
import { Jupyter } from '../jupyter/Jupyter';
import { jupyterTheme } from '../theme/JupyterPrimerTheme';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';
import { CellSidebar } from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookThemeColormode = () => {
  const [theme, setTheme] = useState<Theme>(jupyterTheme);
  const [isThemeOn, setIsThemeOn] = useState(false);
  const [colormode, setColormode] = useState<Colormode>('light');
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    if (isThemeOn) {
      setTheme(primerTheme);
    } else {
      setTheme(jupyterTheme);
    }
  }, [isThemeOn]);
  const onThemeClick = useCallback(() => {
    setIsThemeOn(!isThemeOn);
  }, [isThemeOn]);
  const handleThemeSwitchChange = useCallback((on: boolean) => {
    setIsThemeOn(on);
  }, []);

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
      <Jupyter theme={theme} colormode={colormode}>
        <Box display="flex">
          <Box mr={3}>
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
              onClick={onThemeClick}
              onChange={handleThemeSwitchChange}
              checked={isThemeOn}
              statusLabelPosition="end"
              aria-labelledby="switch-label-theme"
            />
          </Box>
          <Box>
            <Text
              fontSize={2}
              fontWeight="bold"
              id="switch-label"
              display="block"
              mb={1}
            >
              { colormode === 'light' ? 'Light' : 'Dark' } Mode
            </Text>
            <ToggleSwitch
              size="small"
              onClick={onClick}
              onChange={handleSwitchChange}
              checked={isOn}
              statusLabelPosition="end"
              aria-labelledby="switch-label-color-mode"
            />
          </Box>
        </Box>
        <Notebook
          nbformat={nbformat as INotebookContent}
          id="notebook-model-id"
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

root.render(<NotebookThemeColormode />);
