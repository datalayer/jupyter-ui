/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import BrowserOnly from '@docusaurus/core/lib/client/exports/BrowserOnly';
import { ContentLoader } from '@datalayer/primer-addons';

const Cell = (props: any) => {
  return (
    <BrowserOnly
      fallback={<div>Jupyter Cell fallback content for prerendering.</div>}>
      {() => {

        // Keep the import via require in the BrowserOnly code block.
        const { Jupyter } = require('@datalayer/jupyter-react/lib/jupyter/Jupyter');
        const { Cell } = require('@datalayer/jupyter-react/lib/components/cell/Cell');
        
        return (
          <>
            <Jupyter
              jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
              jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
              disableCssLoading={true}
              startDefaultKernel
              skeleton={<ContentLoader/>}
            >
              <Cell {...props}/>
            </Jupyter>
          </>
        )

      }}
    </BrowserOnly>
  )
}

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  Cell,
};

export default ReactLiveScope;
