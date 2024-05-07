/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import { useState, useEffect, useCallback } from 'react';
import { theme as primerTheme, Text, ToggleSwitch, Box } from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import { ColorMode } from '@datalayer/jupyter-react/lib/jupyter/lab/JupyterLabColorMode';
import { jupyterTheme } from '@datalayer/jupyter-react/lib/jupyter/theme';
import dynamic from 'next/dynamic';
import { useTheme, ThemeProvider } from "next-themes";

const NotebookComponentNoSSR = dynamic(
  () => import('../components/NotebookComponent'),
  { ssr: false }
);

const CellComponentNoSSR = dynamic(
  () => import('../components/CellComponent'),
  { ssr: false }
);

const JupyterDemo = () => {

  // next theme can be 'light', 'dark' or 'system'.
  const { theme: nextColorMode, setTheme: setNextColorMode } = useTheme();

  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [isOn, setIsOn] = useState(false);

  const [theme, setTheme] = useState<Theme>(jupyterTheme);
  const [isThemeOn, setIsThemeOn] = useState(false);

  useEffect(() => {
    if (isOn) {
      setColorMode('dark');
      setNextColorMode('dark');
    } else {
      setColorMode('light');
      setNextColorMode('light');
    }
  }, [isOn]);
  const onClick = useCallback(() => {
    setIsOn(!isOn);
  }, [isOn]);
  const handleSwitchChange = useCallback((on: boolean) => {
    setIsOn(on);
  }, []);

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

  return (
    <>
      <Box display="flex">
        <Box mr={3}>
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
            aria-labelledby="switch-label-color-mode"
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
      </Box>
      <NotebookComponentNoSSR colorMode={colorMode} theme={theme}/>
      <CellComponentNoSSR colorMode={colorMode} theme={theme}/>
    </>
  )
}

export default function Home() {

  // See https://github.com/pacocoursey/next-themes?tab=readme-ov-file#avoid-hydration-mismatch
  const [mounted, setMounted] = useState(false)
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, []);
  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider>
      <JupyterDemo/>
    </ThemeProvider>
  )

}
