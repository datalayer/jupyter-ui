import { ActionList, Avatar, ActionMenu, ProgressBar, Box } from '@primer/react';
import { LinkIcon } from '@primer/octicons-react';
import { DatalayerGreenIcon } from "@datalayer/icons-react";

const CellTab = (): JSX.Element => {
  return (
    <>
      <ActionMenu>
        <ActionMenu.Button>Cells</ActionMenu.Button>
        <ActionMenu.Overlay>
          <ActionList>
            <ActionList.Item onSelect={event => console.log('New cell')}>
              New cell
            </ActionList.Item>
            <ActionList.Item>Copy cell</ActionList.Item>
            <ActionList.Item>Edit cell</ActionList.Item>
            <ActionList.Divider />
            <ActionList.Item variant="danger">Delete cell</ActionList.Item>
          </ActionList>
        </ActionMenu.Overlay>
      </ActionMenu>
      <ActionList>
        <ActionList.Item>
          <ActionList.LeadingVisual>
            <DatalayerGreenIcon />
          </ActionList.LeadingVisual>
          Dask kernel
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
      </ActionList>
    </>
  );
};

export default CellTab;
