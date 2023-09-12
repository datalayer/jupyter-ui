import { useState} from 'react';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import { CpuIcon, CodeIcon, AlertIcon, HistoryIcon, CommentDiscussionIcon } from '@primer/octicons-react';
import { UnderlineNav } from '@primer/react/drafts';
import { timer, TimerView } from "./../store";
import MockTab1 from './MockTab1';
import MockTab2 from './MockTab2';
import MockTab3 from './MockTab3';
import MockTab4 from './MockTab4';
import MockTab5 from './MockTab5';

const MockComponent = (): JSX.Element => {
  const [tab, setTab] = useState(1);
  return (
    <>
      <TimerView timer={timer}/>
      <ThemeProvider>
        <BaseStyles>
          <Box style={{maxWidth: 700}}>
            <Box mb={3}>
              <UnderlineNav>
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
            <Box>
              {(tab === 1) && <MockTab1/>}
              {(tab === 2) && <MockTab2/>}
              {(tab === 3) && <MockTab3/>}
              {(tab === 4) && <MockTab4/>}
              {(tab === 5) && <MockTab5/>}
            </Box>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </>
  );
};

export default MockComponent;
