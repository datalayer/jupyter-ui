/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import BrowserOnly from '@docusaurus/core/lib/client/exports/BrowserOnly';
import { ContentLoader } from '@datalayer/primer-addons';

type JupyterCellProps = {
  jupyterServerUrl: string;
  jupyterServerToken: string;
  source: string;
}

const JupyterCell = (props: JupyterCellProps) => {
  const { jupyterServerUrl, jupyterServerToken, source } = props;
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
              jupyterServerUrl={jupyterServerUrl}
              jupyterServerToken={jupyterServerToken}
              disableCssLoading={true}
              skeleton={<ContentLoader/>}
            >
              <Cell source={source}/>
            </Jupyter>
          </>
        )
      }}
    </BrowserOnly>
  )
}

export default JupyterCell;
