/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * Datalayer License
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import RichEditor from '@datalayer/jupyter-lexical/lib/examples/App';

const meta: Meta<typeof RichEditor> = {
  title: 'Components/RichEditor',
  component: RichEditor,
  argTypes: {
  },
} as Meta<typeof RichEditor>;

export default meta;

type Story = StoryObj<typeof RichEditor>;

const Template = (args, { globals: { labComparison } }) => {
  const { nbformat, nbformatUrl, outputs, ...others } = args;
  return (
    <RichEditor/>
  );
};

export const Default: Story = {
  render: (args, options) => Template.bind({})({ }, { globals: { labComparison: true } }),
};
Default.args = {
};
