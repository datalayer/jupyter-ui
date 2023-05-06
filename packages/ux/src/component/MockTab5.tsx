import {
  ActionList,
  Avatar,
  ActionMenu,
  ProgressBar,
  Box,
  Popover,
  Button,
  Heading,
  Text
} from '@primer/react';
import { LinkIcon, AlertIcon } from '@primer/octicons-react';
import { DaskLogoIcon, PyTorchLogoIcon, TensorFlowLogoIcon } from "@datalayer/icons";

const MockTab5 = (): JSX.Element => {
  return (
    <>
        <ActionMenu>
          <ActionMenu.Button>Menu</ActionMenu.Button>
          <ActionMenu.Overlay>
            <ActionList>
              <ActionList.Item onSelect={event => console.log('New file')}>
                New file
              </ActionList.Item>
              <ActionList.Item>Copy link</ActionList.Item>
              <ActionList.Item>Edit file</ActionList.Item>
              <ActionList.Divider />
              <ActionList.Item variant="danger">Delete file</ActionList.Item>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
        <ActionList>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              <DaskLogoIcon />
            </ActionList.LeadingVisual>
            Dask kernel
          </ActionList.Item>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              <PyTorchLogoIcon />
            </ActionList.LeadingVisual>
            PyTorch Kernel
          </ActionList.Item>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              <TensorFlowLogoIcon />
            </ActionList.LeadingVisual>
            Tensorflow Kernel
          </ActionList.Item>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              <LinkIcon />
            </ActionList.LeadingVisual>
            github.com/primer
          </ActionList.Item>
          <ActionList.Item variant="danger">
            <ActionList.LeadingVisual>
              <AlertIcon />
            </ActionList.LeadingVisual>
            4 vulnerabilities
          </ActionList.Item>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              <Avatar src="https://github.com/mona.png" />
            </ActionList.LeadingVisual>
            mona
          </ActionList.Item>
        </ActionList>
        <ProgressBar progress={80} />
        <Box style={{width: 300, paddingTop: 20}}>
          <Box justifyContent="center" display="flex">
            <Button variant="primary">Hello!</Button>
          </Box>
          <Popover relative open={true} caret="top">
            <Popover.Content sx={{mt: 2}}>
              <Heading sx={{fontSize: 2}}>Popover heading</Heading>
              <Text as="p">Message about this particular piece of UI.</Text>
              <Button>Got it!</Button>
            </Popover.Content>
          </Popover>
        </Box>
    </>
  );
};

export default MockTab5;
