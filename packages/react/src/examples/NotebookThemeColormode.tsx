/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Text, ToggleSwitch, theme as primerTheme } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import {
  CellSidebarExtension,
  Notebook2,
  NotebookToolbar,
} from '../components';
import { useJupyterReactStore } from '../state';
import { jupyterLabTheme, JupyterReactTheme } from '../theme';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookThemeColormodeExample = () => {
  const { serviceManager } = useJupyter();
  const { colormode, setColormode } = useJupyterReactStore();
  const [theme, setTheme] = useState<any>(jupyterLabTheme);
  const [isThemeOn, setIsThemeOn] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const extensions = useMemo(() => [new CellSidebarExtension()], [colormode]);
  useEffect(() => {
    if (isThemeOn) {
      setTheme(primerTheme);
    } else {
      setTheme(jupyterLabTheme);
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
      <JupyterReactTheme theme={theme}>
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
              {colormode === 'light' ? 'Light' : 'Dark'} Mode
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
        {serviceManager && (
          <Notebook2
            nbformat={nbformat as INotebookContent}
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

root.render(<NotebookThemeColormodeExample />);
