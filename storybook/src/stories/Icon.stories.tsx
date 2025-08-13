/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import * as dtIcons from '@datalayer/icons-react';

import * as jpIcons from '@jupyterlab/ui-components';

import React from 'react';

const meta: Meta = {
  title: 'Components/Icon',
  argTypes: {
    icon: {
      control: 'text',
      options: ['copyright', 'undo'],
    },
  },
} as Meta;

export default meta;

type Story = StoryObj;

const Template = (args, { globals: { labComparison } }) => {
  const icon = ((args.icon ?? 'undo') as string).toLowerCase();
  const datalayerIcon =
    dtIcons[icon.charAt(0).toUpperCase() + icon.slice(1) + 'Icon'];
  const labIcon: jpIcons.LabIcon =
    labComparison === 'display' ? jpIcons[icon + 'Icon'] : null;
  console.log(datalayerIcon, labIcon);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {datalayerIcon
        ? React.createElement(datalayerIcon)
        : 'Unknown DataLayer icon'}
      {labIcon ? <labIcon.react tag="span" /> : 'Unknown Jupyter icon'}
    </div>
  );
};

export const Default: Story = Template.bind({}) as Story;
Default.args = {
  icon: 'undo',
};

export const Playground: Story = Template.bind({}) as Story;
Playground.args = {
  ...Default.args,
};

export const Copyright: Story = Template.bind({}) as Story;
Copyright.args = {
  icon: 'copyright',
};

export const Undo: Story = Template.bind({}) as Story;
Undo.args = {
  icon: 'undo',
};
