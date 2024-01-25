/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import { Jupyter, Cell } from '@datalayer/jupyter-react';

type CellComponentProps = {
  colorMode: 'light' | 'dark';
}

export const CellComponent = (props: CellComponentProps) => {
  const { colorMode } = props;
  return (
    <>
      <div style={{fontSize: 20}}>Jupyter Cell in Next.js</div>
      <Jupyter
        jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
        jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
        jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        colorMode={colorMode}
      >
        <Cell/>
    </Jupyter>
  </>
  )
}

export default CellComponent;