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
};

const JupyterCell = (props: JupyterCellProps) => {
  return (
    <BrowserOnly
      fallback={<div>Jupyter Cell fallback content for prerendering.</div>}
    >
      {() => {
        // Keep the import via require and keep it into the BrowserOnly code block..
        // const { JupyterReactTheme } = require('@datalayer/jupyter-react/lib/theme');
        // const { useJupyter } = require('@datalayer/jupyter-react/lib/jupyter/JupyterContext');
        const {
          JupyterReactTheme,
        } = require('@datalayer/jupyter-react/lib/theme/JupyterReactTheme');
        const {
          Cell,
        } = require('@datalayer/jupyter-react/lib/components/cell/Cell');
        const {
          jupyterServerUrl = 'https://oss.datalayer.run/api/jupyter-server',
          jupyterServerToken = '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6',
          source = '',
        } = props;
        /*
        useJupyter({ jupyterServerUrl, jupyterServerToken });
        */
        return (
          <>
            <JupyterReactTheme
            //              jupyterServerUrl={jupyterServerUrl}
            //              jupyterServerToken={jupyterServerToken}
            //              startDefaultKernel
            //              skeleton={<ContentLoader />}
            >
              <Cell source={source} />
            </JupyterReactTheme>
          </>
        );
      }}
    </BrowserOnly>
  );
};

export default JupyterCell;
