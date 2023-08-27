import { useState, useEffect } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import { UnderlineNav } from '@primer/react';
import { ReactJsIcon, RingedPlanetIcon } from '@datalayer/icons-react';
import { ServerConnection } from '@jupyterlab/services';
import AboutTab from './tabs/AboutTab';
import ComponentsTab from './tabs/ComponentsTab';
import { requestAPI } from '../jupyter/JupyterHandlers';

export type JupyterFrontEndProps = {
  app?: JupyterFrontEnd;
}

const JupyterReact = (props: JupyterFrontEndProps): JSX.Element => {
  const { app } = props;
  const [tab, setTab] = useState(1);
  const [version, setVersion] = useState('');
  useEffect(() => {
    requestAPI<any>(ServerConnection.makeSettings(), 'jupyter_react', 'config')
    .then(data => {
      setVersion(data.version);
    })
    .catch(reason => {
      console.error(
        `Error while accessing the jupyter server jupyter_react extension.\n${reason}`
      );
    });
  });
  return (
    <>
      <ThemeProvider>
        <BaseStyles>
          <Box style={{maxWidth: 700}}>
            <Box mb={3}>
              <UnderlineNav aria-label="jupyter-react">
                <UnderlineNav.Item aria-current="page" icon={RingedPlanetIcon} onSelect={e => {e.preventDefault(); setTab(1);}}>
                  Components
                </UnderlineNav.Item>
                <UnderlineNav.Item icon={ReactJsIcon} onSelect={e => {e.preventDefault(); setTab(2);}}>
                  About
                </UnderlineNav.Item>
              </UnderlineNav>
            </Box>
            <Box m={3}>
              {(tab === 1) && <ComponentsTab app={app}/>}
              {(tab === 2) && <AboutTab version={version}/>}
            </Box>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </>
  );
};

export default JupyterReact;
