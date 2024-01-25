/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import { useState, useEffect, useCallback } from 'react';
import { Text, ToggleSwitch } from '@primer/react';
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

  const { themes, theme, setTheme } = useTheme();
  console.log('---', themes)

  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    if (isOn) {
      setTheme('dark');
    } else {
      setTheme('light');
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
     <Text
        fontSize={2}
        fontWeight="bold"
        id="switch-label"
        display="block"
        mb={1}
      >
        { theme === 'light' ? 'Light' : 'Dark' } Mode
      </Text>
      <ToggleSwitch
        size="small"
        onClick={onClick}
        onChange={handleSwitchChange}
        checked={isOn}
        statusLabelPosition="end"
        aria-labelledby="switch-label"
      />
      <NotebookComponentNoSSR colorMode={theme === 'light' ? 'light' : 'dark'} />
      <CellComponentNoSSR colorMode={theme === 'light' ? 'light' : 'dark'} />
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
