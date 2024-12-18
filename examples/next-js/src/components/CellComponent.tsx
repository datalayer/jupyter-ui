/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import { Jupyter, Cell } from '@datalayer/jupyter-react';
import { Theme } from '@primer/react/lib/ThemeProvider';

type CellComponentProps = {
  colorMode: 'light' | 'dark';
  theme: Theme;
}

export const CellComponent = (props: CellComponentProps) => {
  const { colorMode, theme } = props;
  return (
    <>
      <div style={{fontSize: 20}}>Jupyter Cell in Next.js</div>
      <Jupyter
        jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
        jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        colormode={colorMode}
        theme={theme}
        startDefaultKernel
      >
        <Cell/>
    </Jupyter>
  </>
  )
}

export default CellComponent;