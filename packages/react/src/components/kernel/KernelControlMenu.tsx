/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  ActionMenu,
  ActionList,
  IconButton,
} from '@primer/react';
import {
  KebabHorizontalIcon,
  StopIcon,
  PaintbrushIcon,
} from '@primer/octicons-react';
import OutputAdapter from './../output/OutputAdapter';

type Props = {
  outputAdapter: OutputAdapter;
};

export const KernelControlMenu = (props: Props) => {
  const { outputAdapter } = props;
  return (
    <ActionMenu>
      <ActionMenu.Anchor>
        <IconButton
          aria-labelledby=""
          icon={KebabHorizontalIcon}
          variant="invisible"
        />
      </ActionMenu.Anchor>
      <ActionMenu.Overlay>
        <ActionList>
          <ActionList.Item
            onSelect={e => {
              e.preventDefault();
              outputAdapter.interrupt();
            }}
          >
            <ActionList.LeadingVisual>
              <StopIcon />
            </ActionList.LeadingVisual>
            Interrupt kernel
          </ActionList.Item>
          <ActionList.Item
            variant="danger"
            onClick={e => {
              e.preventDefault();
              outputAdapter.clear();
            }}
          >
            <ActionList.LeadingVisual>
              <PaintbrushIcon />
            </ActionList.LeadingVisual>
            Clear outputs
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}

export default KernelControlMenu;
