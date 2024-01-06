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
import OutputAdapter from '../output/OutputAdapter';
import Kernel from '../../jupyter/kernel/Kernel';

type Props = {
  kernel?: Kernel;
  outputAdapter?: OutputAdapter;
};

export const KernelActionMenu = (props: Props) => {
  const { kernel, outputAdapter } = props;
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
          { kernel && 
            <ActionList.Item
              onSelect={e => {
                e.preventDefault();
                kernel.interrupt();
              }}
            >
              <ActionList.LeadingVisual>
                <StopIcon />
              </ActionList.LeadingVisual>
              Interrupt kernel
            </ActionList.Item>
          }
          { outputAdapter &&
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
          }
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  );
}

export default KernelActionMenu;
