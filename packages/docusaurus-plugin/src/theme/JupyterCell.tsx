import React from 'react';
import BrowserOnly from '@docusaurus/core/lib/client/exports/BrowserOnly';

const JupyterCell = (props: any) => {
  const { token, serverHttpUrl, serverWsUrl, source } = props;
  return (
    <BrowserOnly
      fallback={<div>Jupyter Cell fallback content for prerendering.</div>}>
      {() => {
        // Keep the import via require in the BrowserOnly code block.
        const { Jupyter } = require('@datalayer/jupyter-react');
        const { Cell } = require('@datalayer/jupyter-react');
        return (
          <Jupyter
            jupyterToken={token}
            jupyterServerHttpUrl={serverHttpUrl}
            jupyterServerWsUrl={serverWsUrl}
            collaborative={false}
            terminals={false}
          >
            <Cell source={source}/>
          </Jupyter>
        )
      }}
    </BrowserOnly>
  )
}

export default JupyterCell;
