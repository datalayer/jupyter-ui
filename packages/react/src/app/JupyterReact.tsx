import { useState, useEffect } from 'react';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import { UnderlineNav } from '@primer/react/drafts';
import { ReactJsIcon as AboutIcon, NetworkIcon as PluginsIcon } from '@datalayer/icons-react';
import { ServerConnection } from '@jupyterlab/services';
import AboutTab from './tabs/AboutTab';
import PluginsTab from './tabs/PluginsTab';
import { requestAPI } from '../jupyter/JupyterHandlers';

const JupyterReact = (): JSX.Element => {
  const [tab, setTab] = useState(1);
  const [version, setVersion] = useState('');
  useEffect(() => {
    requestAPI<any>(ServerConnection.makeSettings(), 'jupyter_react', 'get_config')
    .then(data => {
      setVersion(data.version);
    })
    .catch(reason => {
      console.error(
        `The Jupyter Server jupyter_react extension appears to be missing.\n${reason}`
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
                <UnderlineNav.Item aria-current="page" icon={AboutIcon} onSelect={e => {e.preventDefault(); setTab(1);}}>
                  About
                </UnderlineNav.Item>
                <UnderlineNav.Item icon={PluginsIcon} onSelect={e => {e.preventDefault(); setTab(2);}}>
                  Plugins
                </UnderlineNav.Item>
              </UnderlineNav>
            </Box>
            <Box m={3}>
              {(tab === 1) && <AboutTab version={version}/>}
              {(tab === 2) && <PluginsTab/>}
            </Box>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </>
  );
};

export default JupyterReact;
