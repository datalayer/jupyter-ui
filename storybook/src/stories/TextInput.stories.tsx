/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { InputGroup } from '@jupyterlab/ui-components';
import { TextInput } from '@datalayer/jupyter-react';
import { getTextInputArgTypes } from './_utils/story-helpers';

const meta: Meta<typeof TextInput> = {
  title: 'Components/TextInput',
} as Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof TextInput>;

const Template = (args, { globals: { labComparison } }) => {
  return (
    <>
      <TextInput block={args.block ?? true} {...args} />
      {labComparison === 'display' && (
        <InputGroup
          className="vertical-spacer"
          type={args.type}
          placeholder={args.placeholder}
          disabled={args.disabled}
        />
      )}
    </>
  );
};

export const Default = Template.bind({}) as Story;

export const Playground: Story = {
  render: (args, options) =>
    Template.bind({})({ label: 'TextInput', ...args }, { globals: { labComparison: true } }),
};
Playground.args = {
  type: 'text',
  onChange: () => {},
};
Playground.argTypes = {
  type: {
    control: {
      type: 'text',
    },
  },
  ...getTextInputArgTypes(),
};
