/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from "react";
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@datalayer/jupyter-react';

const meta: Meta<typeof Button> = {
  title: 'Components/About',
} as Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof Button>;

const Template = (args, { globals: { labComparison } }) => {
  return (
    <>
      <Button {...args}>{args.label ?? 'Default'}</Button>
    </>
  );
};

export const Default = Template.bind({});

export const Playground: Story = {
  render: (args, options) =>
    Template.bind({})({ label: 'Default', ...args }, { globals: { labComparison: true } }),
};
Playground.argTypes = {

};
Playground.args = {
};
