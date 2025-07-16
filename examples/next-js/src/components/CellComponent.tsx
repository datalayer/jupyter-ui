/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client';

import { useEffect, useState } from 'react';
import { useJupyter, JupyterReactTheme } from '@datalayer/jupyter-react';
import dynamic from 'next/dynamic';

// Dynamically import the Cell component with SSR disabled
const Cell = dynamic(
  () => import('@datalayer/jupyter-react').then((mod) => ({ default: mod.Cell })),
  { 
    ssr: false,
    loading: () => <p>Loading Jupyter Cell...</p>
  }
);

export const CellComponent = () => {
  const { defaultKernel } = useJupyter({
    jupyterServerUrl: "https://oss.datalayer.run/api/jupyter-server",
    jupyterServerToken: "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6",
    startDefaultKernel: true,
  });
  if (!defaultKernel) {
    return <p>Loading Jupyter Cell...</p>;
  }
  return (
    <>
       <div style={{fontSize: 20}}>Jupyter Cell in Next.js</div>
      <JupyterReactTheme>
        <Cell 
          id="test-cell"
          type="code"
          source="1+1"
          kernel={defaultKernel}
          autoStart
        />
      </JupyterReactTheme>
    </>
  )
}

export default CellComponent;
