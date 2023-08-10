import { useState, useEffect } from 'react';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import { CpuIcon, CodeIcon, AlertIcon, HistoryIcon, CommentDiscussionIcon } from '@primer/octicons-react';
import { UnderlineNav } from '@primer/react/drafts';
import Tab1 from './tabs/Tab1';
import Tab2 from './tabs/Tab2';
import Tab3 from './tabs/Tab3';
import Tab4 from './tabs/Tab4';
import Tab5 from './tabs/Tab5';
import { requestAPI } from '../handler';

const Tabs = (): JSX.Element => {
  const [tab, setTab] = useState(1);
  const [version, setVersion] = useState('');
  useEffect(() => {
    requestAPI<any>('get_config')
    .then(data => {
      setVersion(data.version);
    })
    .catch(reason => {
      console.error(
        `The Jupyter Server datalayer_example extension appears to be missing.\n${reason}`
      );
    });
  });
  return (
    <>
      <ThemeProvider>
        <BaseStyles>
          <Box style={{maxWidth: 700}}>
            <Box>
              <UnderlineNav aria-label="datalayer-example">
                <UnderlineNav.Item aria-current="page" icon={CpuIcon} onSelect={e => {e.preventDefault(); setTab(1);}}>
                  Kernels
                </UnderlineNav.Item>
                <UnderlineNav.Item icon={CodeIcon} counter={6} onSelect={e => {e.preventDefault(); setTab(2);}}>
                  Notebooks
                </UnderlineNav.Item>
                <UnderlineNav.Item icon={AlertIcon} onSelect={e => {e.preventDefault(); setTab(3);}}>
                  Warnings
                </UnderlineNav.Item>
                <UnderlineNav.Item icon={HistoryIcon} counter={7} onSelect={e => {e.preventDefault(); setTab(4);}}>
                  History
                </UnderlineNav.Item>
                <UnderlineNav.Item icon={CommentDiscussionIcon} onSelect={e => {e.preventDefault(); setTab(5);}}>
                  More
                </UnderlineNav.Item>
              </UnderlineNav>
            </Box>
            <Box m={3}>
              {(tab === 1) && <Tab1 version={version}/>}
              {(tab === 2) && <Tab2/>}
              {(tab === 3) && <Tab3/>}
              {(tab === 4) && <Tab4/>}
              {(tab === 5) && <Tab5/>}
            </Box>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </>
  );
}

export default Tabs;
