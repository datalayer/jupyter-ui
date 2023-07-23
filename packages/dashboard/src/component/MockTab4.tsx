import { Timeline, StyledOcticon, Link, Box, SubNav } from '@primer/react';
import { DaskIcon, PyTorchIcon, TensorFlowNoopIcon } from "@datalayer/icons-react";

const MockTab4 = (): JSX.Element => {
  return (
    <Box m={1}>
      <SubNav>
        <SubNav.Links>
          <SubNav.Link href="#" selected>
            All
          </SubNav.Link>
          <SubNav.Link href="#">Recent</SubNav.Link>
          <SubNav.Link href="#">Older</SubNav.Link>
        </SubNav.Links>
      </SubNav>
      <Timeline>
        <Timeline.Item>
          <Timeline.Badge>
            <StyledOcticon icon={PyTorchIcon} />
          </Timeline.Badge>
          <Timeline.Body>
            <Link href="#" sx={{fontWeight: 'bold', color: 'fg.default', mr: 1}} muted>
              You
            </Link>
            created one <Link href="#" sx={{fontWeight: 'bold', color: 'fg.default', mr: 1}} muted>
              PyTorch Kernel
            </Link>
            <Link href="#" color="fg.muted" muted>
              Just now
            </Link>
          </Timeline.Body>
        </Timeline.Item>
        <Timeline.Item>
          <Timeline.Badge>
            <StyledOcticon icon={TensorFlowNoopIcon} />
          </Timeline.Badge>
          <Timeline.Body>
            <Link href="#" sx={{fontWeight: 'bold', color: 'fg.default', mr: 1}} muted>
              You
            </Link>
            created one <Link href="#" sx={{fontWeight: 'bold', color: 'fg.default', mr: 1}} muted>
              TensorFlow Kernel
            </Link>
            <Link href="#" color="fg.muted" muted>
              5m ago
            </Link>
          </Timeline.Body>
        </Timeline.Item>
        <Timeline.Item>
          <Timeline.Badge>
            <StyledOcticon icon={DaskIcon} />
          </Timeline.Badge>
          <Timeline.Body>
            <Link href="#" sx={{fontWeight: 'bold', color: 'fg.default', mr: 1}} muted>
              You
            </Link>
            created one <Link href="#" sx={{fontWeight: 'bold', color: 'fg.default', mr: 1}} muted>
              Dask Kernel
            </Link>
            <Link href="#" color="fg.muted" muted>
              7m ago
            </Link>
          </Timeline.Body>
        </Timeline.Item>
      </Timeline>
    </Box>
  );
};

export default MockTab4;
