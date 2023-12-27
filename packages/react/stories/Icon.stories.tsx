/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { UndoIcon } from '@datalayer/icons-react';

import { undoIcon } from '@jupyterlab/ui-components/lib/icon/iconimports';

import React from 'react';

const meta: Meta = {
  title: 'Components/Icon',
} as Meta;

export default meta;

type Story = StoryObj;

const Template = (args, { globals: { labComparison } }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <UndoIcon />
      {/* FIXME webpack is not able to bundle the lab SVG */}
      {labComparison === 'display' && <undoIcon.react tag="span" />}
    </div>
  );
};

export const Default: Story = Template.bind({});
