import React from 'react';
import BrowserOnly from '@docusaurus/core/lib/client/exports/BrowserOnly';

import './JupyterCell.css';

const JupyterCell = (props: any) => {
  return (
      <BrowserOnly
        fallback={<div>Jupyter fallback content for prerendering</div>}>
        {() => {
          // Keep the import via require in the BrowserOnly code block.
          const { Jupyter } = require('@datalayer/jupyter-react');
          const { Cell } = require('@datalayer/jupyter-react');
          return (
            <Jupyter
              jupyterToken={props.token}
              jupyterServerHttpUrl={props.serverHttpUrl}
              jupyterServerWsUrl={props.serverWsUrl}
              collaborative={false}
              terminals={false}>
                <Cell source={props.source}/>
            </Jupyter>
          )
        }}
      </BrowserOnly>
  );
}

export default JupyterCell;
