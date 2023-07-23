import {
  ActionList,
  Avatar,
  ActionMenu,
  ProgressBar,
  Box,
} from '@primer/react';
import { LinkIcon, AlertIcon } from '@primer/octicons-react';
import { DaskIcon, PyTorchIcon, TensorFlowNoopIcon } from "@datalayer/icons-react";

const MockTab1 = (): JSX.Element => {
  return (
    <>
      <ActionMenu>
        <ActionMenu.Button>Kernels</ActionMenu.Button>
        <ActionMenu.Overlay>
          <ActionList>
            <ActionList.Item onSelect={event => console.log('New file')}>
              New kernel
            </ActionList.Item>
            <ActionList.Item>Copy kernel</ActionList.Item>
            <ActionList.Item>Edit kernel</ActionList.Item>
            <ActionList.Divider />
            <ActionList.Item variant="danger">Delete kernel</ActionList.Item>
          </ActionList>
        </ActionMenu.Overlay>
      </ActionMenu>
      <ActionList>
        <ActionList.Item>
          <ActionList.LeadingVisual>
            <DaskIcon />
          </ActionList.LeadingVisual>
          Dask kernel
        </ActionList.Item>
        <ActionList.Item>
          <ActionList.LeadingVisual>
            <PyTorchIcon />
          </ActionList.LeadingVisual>
          PyTorch Kernel
        </ActionList.Item>
        <ActionList.Item>
          <ActionList.LeadingVisual>
            <TensorFlowNoopIcon />
          </ActionList.LeadingVisual>
          Tensorflow Kernel
        </ActionList.Item>
        <Box borderColor="border.default" borderBottomWidth={1} borderBottomStyle="solid" pb={3}/>
        <ActionList.Item>
          <ActionList.LeadingVisual>
            <LinkIcon />
          </ActionList.LeadingVisual>
          Starting...
        </ActionList.Item>
        <ProgressBar progress={80} />
        <Box borderColor="border.default" borderBottomWidth={1} borderBottomStyle="solid" pb={3}/>
        <ActionList.Item>
          <ActionList.LeadingVisual>
            <Avatar src="https://github.com/mona.png" />
          </ActionList.LeadingVisual>
          Me
        </ActionList.Item>
        <ActionList.Item variant="danger">
          <ActionList.LeadingVisual>
            <AlertIcon />
          </ActionList.LeadingVisual>
          4 vulnerabilities
        </ActionList.Item>
      </ActionList>
    </>
  );
};

export default MockTab1;
