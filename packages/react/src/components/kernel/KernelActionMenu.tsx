/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ActionMenu, ActionList, IconButton } from '@primer/react';
import {
  KebabHorizontalIcon,
  StopIcon,
  PaintbrushIcon,
} from '@primer/octicons-react';
import { RestartIcon } from '@datalayer/icons-react';
import OutputAdapter from '../output/OutputAdapter';
import Kernel from '../../jupyter/kernel/Kernel';

export type KernelActionMenuProps = {
  kernel?: Kernel;
  outputAdapter?: OutputAdapter;
  onClearOutputs?: () => void;
};

export const KernelActionMenu = (props: KernelActionMenuProps) => {
  const { kernel, outputAdapter, onClearOutputs } = props;
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
            disabled={!kernel}
            onSelect={e => {
              if (kernel) {
                kernel.interrupt();
              }
            }}
          >
            <ActionList.LeadingVisual>
              <StopIcon />
            </ActionList.LeadingVisual>
            Interrupt kernel
          </ActionList.Item>
          <ActionList.Item
            disabled={!kernel}
            onSelect={e => {
              if (kernel) {
                kernel.restart();
              }
            }}
          >
            <ActionList.LeadingVisual>
              <RestartIcon />
            </ActionList.LeadingVisual>
            Restart kernel
          </ActionList.Item>
          <ActionList.Item
            variant="danger"
            disabled={false}
            onSelect={e => {
              console.log(
                '[KernelActionMenu] Clear outputs clicked - onClearOutputs:',
                !!onClearOutputs,
                'outputAdapter:',
                !!outputAdapter
              );
              if (onClearOutputs) {
                onClearOutputs();
              } else if (outputAdapter) {
                outputAdapter.clear();
              } else {
                console.warn('[KernelActionMenu] No clear method available!');
              }
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
};

export default KernelActionMenu;
