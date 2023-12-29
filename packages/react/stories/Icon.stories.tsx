/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CopyrightIcon } from '@datalayer/icons-react';
import { UndoIcon } from '@datalayer/icons-react';

import { copyrightIcon } from '@jupyterlab/ui-components/lib/icon/iconimports';
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
      <CopyrightIcon />
      {labComparison === 'display' && (
        <>
          <copyrightIcon.react tag="span" />
          <undoIcon.react tag="span" />
        </>
      )}
    </div>
  );
};

export const Default = Template.bind({});

export const Playground: Story = {
  render: (args, options) =>
    Template.bind({})({ ...args }, options),
};
Playground.argTypes = {
};
Playground.args = {
};

export const Copyright: Story = {
  render: (args, options) =>
    Template.bind({})({ ...args }, options),
};
Copyright.args = {
};

export const Undo: Story = {
  render: (args, options) =>
    Template.bind({})({ ...args }, options),
};
Undo.args = {
};
